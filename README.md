# distributed-state-controller

This library simplifies the implementation of Channels card components that need to have state information synchronized between channel participants.  For example, if the card is a shared to-do list, then as any participant adds or updates an item in the list, all other participants' cards must be updated accordingly.  Simply sending a message containing the change from a card where the change is made to all other cards (in a card-to-card message) is typically insufficient.  Race conditions can result in messages being processed in a different order by different participant cards, resulting in inconsistent state between those clients.

## Distributed State

This library helps with state information that is "shared" among several participants and needs to be kept synchronized.  There are two kinds of state information supported by this library:  properties and arrays.  These are intentionally aligned with Polymer's properties and data binding system.  However, there is nothing in this library that requires that the card component using this library uses Polymer.  Properties are serializable javascript objects (including simple strings, etc., or objects) where an object or one of its members can be updated to a new value.  Arrays are javascript arrays containing elements that are serializable javascript objects that must contain globally unique "id" members among other things.  (It is recommended that GUIDs are used to ensure there are no naming collisions in a distributed network.)  State changes on arrays consist of inserts, removals, reordering, and element updates.

## Examples

### Shared property example

In this example, imagine a card with two buttons, labeled 'red' and 'green' and a box whose color is determined by the value of the "color" member of the state object.

When any participant using this card clicks on the 'red' button, we want the box on all cards to turn red.  Likewise, when anyone clicks on 'green', all boxes turn green.

This is accomplished by a card that handles state changes using the distributed-state-controller.  When a user clicks on a button, the state controller is asked to update the 'color' property.  The controller will formulate a mutation message and ask for it to be sent (using the `sendMutation` member provided when creating the controller), and will ask for the local state information to be updated accordingly (using the `setProperty` member provided when creating the controller).  When an inbound message from another card arrives, the controller is notified using its `handleInboundMessage` method so when another member clicks one of their buttons, the local state is updated accordingly.

```html
<dom-module id="box-card-sample">
  <template>
    <style>
      #box {
        text-align: center;
      }
      .blue {
        background-color: blue;
      }
    </style>
    <div id="box" class$="{{data.color}}" on-click="onClick">click me</div>
  </template>
  <script>
    class BoxCardSample extends Polymer.Element {
      static get is() { return "box-card-sample"; }
      static get properties() {
        return {
          data: Object,
          channel: Object
        };
      }
      constructor() {
        this.stateController = new DistributedStateController();
      }
      connectedCallback() {
        super.connectedCallback();
        this.stateController.initialize(this, this.data);
      }
      onClick() {
        this.stateController.updateProperty('color', this.data.color === "blue" ? "" : "blue");
      }
      handleCardToCardMessageReceived(participant, message) {
        switch (message.json.type) {
          case 'mutation':
            this.stateController.handleInboundMutation(message.json.details, message);
            break;
          default:
            break;
        }
      }
      sendMutation(mutation) {
        return this.channel.sendCardToCardMessage(this, { json: { type: "mutation", details: mutation } }, true, false);
      }
      setProperty(path, value) {
        this.set('data.' + path, value);
      }
    }
    window.customElements.define(BoxCardSample.is, BoxCardSample);
  </script>
</dom-module>
```

### Shared array example

In the following example, a simple card displays a shared list of comments contributed by any of the participants.  When a participant enters a comment and clicks "add", the card asks the controller to insert a new object in the "comments" array.  The controller will call back with `spliceArray` when the array has changed (either because of a local or remote change), and the card updates the state information accordingly.  The `dom-repeat` template is databound to that array, so the new comments will appear automatically.

```html
<dom-module id="comment-card-sample">
  <template>
    <style>
    </style>
    <div>
      <template is="dom-repeat" items="{{data.comments}}">
        <div>{{item.comment}}</div>
      </template>
      <div>
        <input id="textEntry" type="text"> <button on-click="onAddClick">Add</button>
      </div>
    </div>
  </template>
  <script>
    class CommentCardSample extends Polymer.Element {
      static get is() { return 'comment-card-sample'; }
      static get properties() {
        return {
          data: Object,
          channel: Object
        };
      }
      constructor() {
        this.stateController = new DistributedStateController();
      }
      connectedCallback() {
        super.connectedCallback();
        this.stateController.initialize(this, this.data);
      }
      onAddClick() {
        this.stateController.arrayInsert("comments", {comment: this.$.textEntry.value });
        this.$.textEntry.value = "";
      }
      handleCardToCardMessageReceived(participant, message) {
        switch (message.json.type) {
          case 'mutation':
            this.stateController.handleInboundMutation(message.json.details, message);
            break;
          default:
            break;
        }
      }
      sendMutation(mutation) {
        return this.channel.sendCardToCardMessage(this, { json: { type: "mutation", details: mutation } }, true, false);
      }
      spliceArray(path, index, removeCount, recordToInsert) {
        this.splice('data.' + path, index, removeCount, recordToInsert);
      }
    }
    window.customElements.define(CommentCardSample.is, CommentCardSample);
  </script>
</dom-module>
```

## Mutation Processing Concepts

This library is built on the concept of "mutations" as a way to synchronize state among many endpoints without requiring any centralized arbiter or storage.  Each member maintains its own copy of the state.  State changes are expressed as "mutations" -- i.e., directions on how to change the state.  As long as all participants process these mutations in the same way and in the same order, then all participant states will remain synchronized.

Because of race conditions, however, two messages containing mutations from two different participants may arrive in a different order to one participant compared with another.  To deal with this case, there is an agreement among all participants on the order in which mutations will be processed -- chronologically (based on the timestamp in the message carrying the mutation).  Each participant is required to have its timestamps always increasing.  If two participants generate a message with the same timestamp, then the sender's code is used to enforce consistent ordering -- with the message from the lower-numbered sender code being processed first.

So when a participant receives a mutation message, it checks to see if it is "earlier" than the latest mutation already processed.  If so, it rolls back that latest mutation and adds it to a list of pending mutations.  It repeats this process until the new mutation is "later" than the latest mutation, or there are no mutations left that have been applied.  At that point, all pending mutations (including the new one that has arrived) are sorted, and then reapplied in order.