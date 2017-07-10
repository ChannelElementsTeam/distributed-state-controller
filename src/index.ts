const uuid = require('uuid');
import { diff_match_patch, Patch } from 'diff-match-patch';

export class DistributedStateController {
  private host: HostComponent;
  private state: any = {};
  private history: UndoableMutationMessage[] = [];

  initialize(host: HostComponent, initialState?: any) {
    this.host = host;
    if (initialState) {
      this.state = this.copy(initialState);
    }
  }

  async updateProperty(path: string, value: any): Promise<void> {
    const mutation = await this.sendMutation('property-update', path, value);
    this.integrateMutation(mutation);
  }

  async incrementProperty(path: string, amount: number): Promise<void> {
    const mutation = await this.sendMutation('property-increment', path, amount);
    this.integrateMutation(mutation);
  }

  async arrayInsert(path: string, value: any, beforeId?: string): Promise<void> {
    if (typeof value !== 'object') {
      throw new Error("MutationStateController.addRecord: value must be object");
    }
    if (!value.id) {
      value.id = uuid.v4();
    }
    const mutation = await this.sendMutation('array-insert', path, value, value.id, beforeId);
    this.integrateMutation(mutation);
  }

  async arrayRemove(path: string, id: string): Promise<void> {
    const mutation = await this.sendMutation('array-remove', path, null, id);
    this.integrateMutation(mutation);
  }

  async arrayMove(path: string, id: string, beforeId: string): Promise<void> {
    const mutation = await this.sendMutation('array-move', path, null, id, beforeId);
    this.integrateMutation(mutation);
  }

  async arrayElementUpdate(path: string, id: string, internalPath: string, value: any): Promise<void> {
    const mutation = await this.sendMutation('array-element-update', path, value, id, null, internalPath);
    this.integrateMutation(mutation);
  }

  async updateText(path: string, updatedValue: string): Promise<void> {
    const dmp = new diff_match_patch();
    const previousValue = this.getStateElement(this.state, path) || '';
    const patches = dmp.patch_make(previousValue, updatedValue);
    const patchString = dmp.patch_toText(patches);
    const mutation = await this.sendMutation('text-update', path, patchString);
    this.integrateMutation(mutation);
  }

  async handleInboundMutation(mutation: Mutation, messageInfo: CardToCardMessage): Promise<void> {
    this.integrateMutation({ details: mutation, message: messageInfo });
  }

  private integrateMutation(mutation: MutationMessage): void {
    const undoItems: MutationMessage[] = [];
    // If we've already applied some mutations whose timestamps are later than this one being integrated, then we need to undo those first, and redo them afterward
    while (this.history.length > 0 && (this.history[this.history.length - 1].message.timestamp > mutation.message.timestamp || (this.history[this.history.length - 1].message.timestamp === mutation.message.timestamp && this.history[this.history.length - 1].message.senderCode > mutation.message.senderCode))) {
      const undoItem = this.history.pop();
      undoItems.push(undoItem);
      this.undoMutation(undoItem);
    }
    this.applyMutation(mutation);
    while (undoItems.length > 0) {
      const item = undoItems.shift();
      this.applyMutation(item);
    }
  }

  private applyMutation(mutation: MutationMessage): void {
    let mutationInfo: UndoableMutationMessage;
    switch (mutation.details.mutationType) {
      case 'property-update':
        mutationInfo = this.doPropertyUpdate(mutation);
        break;
      case 'property-increment':
        mutationInfo = this.doPropertyIncrement(mutation);
        break;
      case 'array-insert':
        mutationInfo = this.doArrayInsert(mutation);
        break;
      case 'array-remove':
        mutationInfo = this.doArrayRemove(mutation);
        break;
      case 'array-move':
        mutationInfo = this.doArrayMove(mutation);
        break;
      case 'array-element-update':
        mutationInfo = this.doArrayElementUpdate(mutation);
        break;
      case 'text-update':
        mutationInfo = this.doTextUpdate(mutation);
        break;
      default:
        console.error("MutationStateController: unhandled mutation type " + mutation.details.mutationType);
        return;
    }
    if (mutationInfo) {
      this.history.push(mutationInfo);
    }
  }

  private undoMutation(item: UndoableMutationMessage): void {
    console.log("MutationStateController.undoMutation", item);
    switch (item.details.mutationType) {
      case 'property-update':
        this.undoPropertyUpdate(item);
        break;
      case 'property-increment':
        this.undoPropertyIncrement(item);
        break;
      case 'array-insert':
        this.undoArrayInsert(item);
        break;
      case 'array-remove':
        this.undoArrayRemove(item);
        break;
      case 'array-move':
        this.undoArrayMove(item);
        break;
      case 'array-element-update':
        this.undoArrayElementUpdate(item);
        break;
      case 'text-update':
        this.undoTextUpdate(item);
        break;
      default:
        console.error("MutationStateController: unhandled mutation type " + item.details.mutationType);
        return;
    }
  }

  private doPropertyUpdate(item: MutationMessage): UndoableMutationMessage {
    const previousValue = this.getStateElement(this.state, item.details.path);
    const undoable: UndoableMutationMessage = {
      message: item.message,
      details: item.details,
      undoValue: previousValue,
      undoReferenceId: null
    };
    this.setStateElement(this.state, item.details.path, item.details.value);
    if (this.host.setProperty) {
      this.host.setProperty(item.details.path, item.details.value);
    }
    return undoable;
  }

  private undoPropertyUpdate(undoable: UndoableMutationMessage): void {
    this.setStateElement(this.state, undoable.details.path, undoable.undoValue);
    if (this.host.setProperty) {
      this.host.setProperty(undoable.details.path, undoable.undoValue);
    }
  }

  private doPropertyIncrement(item: MutationMessage): UndoableMutationMessage {
    let previousValue = this.getStateElement(this.state, item.details.path);
    if (!previousValue || Number.isNaN(previousValue)) {
      previousValue = 0;
    }
    const undoable: UndoableMutationMessage = {
      message: item.message,
      details: item.details,
      undoValue: previousValue,
      undoReferenceId: null
    };
    const value = item.details.value && !Number.isNaN(item.details.value) ? item.details.value : 0;
    this.setStateElement(this.state, item.details.path, value + previousValue);
    if (this.host.setProperty) {
      this.host.setProperty(item.details.path, value + previousValue);
    }
    return undoable;
  }

  private undoPropertyIncrement(undoable: UndoableMutationMessage): void {
    this.setStateElement(this.state, undoable.details.path, undoable.undoValue);
    if (this.host.setProperty) {
      this.host.setProperty(undoable.details.path, undoable.undoValue);
    }
  }

  private doArrayInsert(item: MutationMessage): UndoableMutationMessage {
    const mutationInfo: UndoableMutationMessage = {
      message: item.message,
      details: item.details,
      undoValue: null,
      undoReferenceId: null
    };
    const array = this.getStateElement(this.state, item.details.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: doArrayInsert: problem with array path');
      return null;
    }
    if (item.details.recordId) {
      item.details.value.id = item.details.recordId;
    } else if (item.details.value.id) {
      item.details.recordId = item.details.value.id;
    } else {
      console.error('MutationStateController.doArrayInsert: recordId is missing and record has no ID');
      return null;
    }
    let found = false;
    let index: number;
    let beforeId: string;
    if (item.details.referenceId) {
      for (let i = 0; i < array.length; i++) {
        if (array[i].id === item.details.referenceId) {
          beforeId = i < array.length - 1 ? array[i + 1].id : null;
          index = i;
          array.splice(i, 0, item.details.value);
          found = true;
          break;
        }
      }
      if (!found) {
        console.error('MutationStateController: doArrayInsert: message referenceId not found');
        return null;
      }
    } else {
      index = array.length;
      array.push(item.details.value);
    }
    if (this.host.spliceArray) {
      this.host.spliceArray(item.details.path, index, 0, this.copy(item.details.value));
    }
    return mutationInfo;
  }

  private undoArrayInsert(undoable: UndoableMutationMessage): void {
    const array = this.getStateElement(this.state, undoable.details.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: undoArrayInsert: problem with array path');
      return null;
    }
    let index: number;
    let found = false;
    if (undoable.details.recordId) {
      for (let i = 0; i < array.length; i++) {
        if (array[i].id === undoable.details.recordId) {
          array.splice(i, 1);
          index = i;
          found = true;
          break;
        }
      }
    }
    if (found) {
      if (this.host.spliceArray) {
        this.host.spliceArray(undoable.details.path, index, 1);
      }
    } else {
      console.error('MutationStateController: undoArrayInsert: message recordId missing');
    }
  }

  private doArrayRemove(item: MutationMessage): UndoableMutationMessage {
    const array = this.getStateElement(this.state, item.details.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: doArrayRemove: problem with array path');
      return null;
    }
    let record: HasId;
    let index: number;
    let referenceId: string;
    for (let i = 0; i < array.length; i++) {
      if (array[i].id === item.details.recordId) {
        record = array[i];
        index = i;
        referenceId = i < array.length - 1 ? array[i + 1].id : null;
        array.splice(i, 1);
        break;
      }
    }
    if (!record) {
      console.error('MutationStateController: doArrayRemove: message recordId not found');
      return null;
    }
    const undoable: UndoableMutationMessage = {
      message: item.message,
      details: item.details,
      undoValue: record,
      undoReferenceId: referenceId
    };
    if (this.host.spliceArray) {
      this.host.spliceArray(item.details.path, index, 1);
    }
    return undoable;
  }

  private undoArrayRemove(undoable: UndoableMutationMessage): void {
    const array = this.getStateElement(this.state, undoable.details.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: undoArrayRemove: problem with array path');
      return null;
    }
    if (undoable.undoReferenceId) {
      for (let i = 0; i < array.length; i++) {
        if (array[i].id === undoable.undoReferenceId) {
          array.splice(i, 0, undoable.undoValue);
          this.host.spliceArray(undoable.details.path, i, 0, this.copy(undoable.undoValue));
          break;
        }
      }
    } else {
      array.push(undoable.undoValue);
      if (this.host.spliceArray) {
        this.host.spliceArray(undoable.details.path, array.length, 0, this.copy(undoable.undoValue));
      }
    }
  }

  private doArrayMove(item: MutationMessage): UndoableMutationMessage {
    const array = this.getStateElement(this.state, item.details.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: doArrayMove: problem with array path');
      return null;
    }
    let record: HasId;
    let fromIndex: number;
    let originalBeforeId: string;
    for (let i = 0; i < array.length; i++) {
      if (array[i].id === item.details.recordId) {
        record = array[i];
        fromIndex = i;
        originalBeforeId = i < array.length - 1 ? array[i + 1].id : null;
        array.splice(i, 1);
        break;
      }
    }
    if (!record) {
      console.error('MutationStateController: doArrayMove: record not found');
      return null;
    }
    let toIndex: number;
    let newBeforeId: string;
    if (item.details.referenceId) {
      let found = false;
      for (let i = 0; i < array.length; i++) {
        if (array[i].id === item.details.referenceId) {
          toIndex = i;
          newBeforeId = i < array.length - 1 ? array[i + 1].id : null;
          array.splice(i, 0, record);
          found = true;
          break;
        }
      }
      if (!found) {
        console.error('MutationStateController: doArrayMove: reference recordId not found');
        return null;
      }
    } else {
      toIndex = array.length;
      array.push(record);
    }
    const undoable: UndoableMutationMessage = {
      message: item.message,
      details: item.details,
      undoValue: record,
      undoReferenceId: originalBeforeId
    };
    if (this.host.spliceArray) {
      this.host.spliceArray(item.details.path, fromIndex, 1);
      this.host.spliceArray(item.details.path, toIndex, 0, this.copy(record));
    }
    return undoable;
  }

  private undoArrayMove(undoable: UndoableMutationMessage): void {
    const array = this.getStateElement(this.state, undoable.details.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: undoArrayMove: problem with array path');
      return null;
    }
    let record: HasId;
    let fromIndex: number;
    let originalBeforeId: string;
    for (let i = 0; i < array.length; i++) {
      if (array[i].id === undoable.details.recordId) {
        record = array[i];
        fromIndex = i;
        originalBeforeId = i < array.length - 1 ? array[i + 1].id : null;
        array.splice(i, 1);
        break;
      }
    }
    if (!record) {
      console.error('MutationStateController: undoArrayMove: record is missing');
      return null;
    }
    let toIndex: number;
    let newBeforeId: string;
    if (undoable.undoReferenceId) {
      let found = false;
      for (let i = 0; i < array.length; i++) {
        if (array[i].id === undoable.undoReferenceId) {
          toIndex = i;
          newBeforeId = i < array.length - 1 ? array[i + 1].id : null;
          array.splice(i, 0, record);
          found = true;
          break;
        }
      }
      if (!found) {
        console.error('MutationStateController: undoArrayMove: undoReferenceId not found');
        return null;
      }
    } else {
      toIndex = array.length;
      array.push(record);
    }
    if (this.host.spliceArray) {
      this.host.spliceArray(undoable.details.path, fromIndex, 1);
      this.host.spliceArray(undoable.details.path, toIndex, 0, this.copy(record));
    }
  }

  private doArrayElementUpdate(item: MutationMessage): UndoableMutationMessage {
    const array = this.getStateElement(this.state, item.details.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: doArrayElementUpdate: problem with array path');
      return null;
    }
    let record: HasId;
    let index: number;
    for (let i = 0; i < array.length; i++) {
      if (array[i].id === item.details.recordId) {
        record = array[i];
        index = i;
        break;
      }
    }
    if (!record) {
      console.error('MutationStateController: doArrayElementUpdate: recordId not found');
      return null;
    }
    const previousValue = this.getStateElement(record, item.details.elementPath);
    const undoable: UndoableMutationMessage = {
      message: item.message,
      details: item.details,
      undoValue: previousValue,
      undoReferenceId: null
    };
    this.setStateElement(record, item.details.elementPath, item.details.value);
    if (this.host.updateRecord) {
      this.host.updateRecord(item.details.path, record.id, index, record, item.details.elementPath, item.details.value);
    }
    return undoable;
  }

  private undoArrayElementUpdate(undoable: UndoableMutationMessage): void {
    const array = this.getStateElement(this.state, undoable.details.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: undoArrayElementUpdate: problem with array path');
      return null;
    }
    let record: HasId;
    let index: number;
    for (let i = 0; i < array.length; i++) {
      if (array[i].id === undoable.details.recordId) {
        record = array[i];
        index = i;
        break;
      }
    }
    if (!record) {
      console.error('MutationStateController: undoArrayElementUpdate: recordId not found');
      return null;
    }
    this.setStateElement(record, undoable.details.elementPath, undoable.undoValue);
    if (this.host.updateRecord) {
      this.host.updateRecord(undoable.details.path, record.id, index, record, undoable.details.elementPath, undoable.undoValue);
    }
  }

  private doTextUpdate(item: MutationMessage): UndoableMutationMessage {
    const previousValue = this.getStateElement(this.state, item.details.path) || '';
    const patchString = item.details.value;
    const dmp = new diff_match_patch();
    const patches = dmp.patch_fromText(patchString);
    const newValue = dmp.patch_apply(patches, previousValue)[0];
    const undoPatches = dmp.patch_make(newValue, previousValue);
    const undoString = dmp.patch_toText(undoPatches);
    const undoable: UndoableMutationMessage = {
      message: item.message,
      details: item.details,
      undoValue: undoString,
      undoReferenceId: null
    };
    this.setStateElement(this.state, item.details.path, newValue);
    if (this.host.updateText) {
      const updater = this.getCaretUpdater(patches);
      this.host.updateText(item.details.path, newValue, updater);
    }
    return undoable;
  }

  private undoTextUpdate(undoable: UndoableMutationMessage): void {
    const currentValue = this.getStateElement(this.state, undoable.details.path) || '';
    const patchString = undoable.details.value;
    const dmp = new diff_match_patch();
    const patches = dmp.patch_fromText(patchString);
    const originalValue = dmp.patch_apply(patches, currentValue)[0];
    this.setStateElement(this.state, undoable.details.path, originalValue);
    if (this.host.updateText) {
      const updater = this.getCaretUpdater(patches);
      this.host.updateText(undoable.details.path, originalValue, updater);
    }
  }

  // This helps with a client who is editing text as to what to do with the current
  // caret (cursor) position when a change happens.  Depending on where there are
  // inserts and deletes relative to the caret position, it may move forward or
  // backward.
  private getCaretUpdater(patches: Patch[]): (position: number) => number {
    return (position: number): number => {
      let offset = 0;
      let position1 = 0;
      let position2 = 0;
      for (const patch of patches) {
        for (const diff of patch.diffs) {
          switch (diff[0]) {
            case 0: // no change
              if (position < position1 + diff[1].length) {
                offset += position - position1;
                return offset;
              }
              position1 += diff[1].length;
              position2 += diff[1].length;
              offset += diff[1].length;
              break;
            case -1: // delete
              if (position < position1 + diff[1].length) {
                offset -= position - position1;
                return offset;
              }
              position1 += diff[1].length;
              break;
            case 1: // insert
              offset += diff[1].length;
              position2 += diff[1].length;
              break;
            default:
              throw new Error("Unexpected diff type: " + diff[0]);
          }
        }
      }
      return offset;
    };
  }

  private getStateElement(state: any, path: string, isArray = false): any {
    let object = state;
    const parts = path.split('.');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (typeof object === 'object') {
        if (!object[part]) {
          object[part] = i < parts.length - 1 ? {} : (isArray ? [] : null);
        }
        object = object[part];
      } else if (i < parts.length - 1) {
        console.warn("MutationStateController.getStateElement: intermediate path element is not object", path, part, i);
        return undefined;
      } else {
        if (object[part]) {
          object = object[part];
        } else if (isArray) {
          object[part] = [];
          object = object[part];
        }
      }
    }
    if (isArray) {
      if (Array.isArray(object)) {
        return object;
      } else {
        return null;
      }
    } else {
      return object;
    }
  }

  private setStateElement(state: any, path: string, value: any): void {
    const parts = path.split('.');
    let object = state;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!object) {
        object = {};
      }
      if (Array.isArray(object)) {
        let found = false;
        for (const element of object) {
          if (element.id === part) {
            object = element;
            found = true;
            break;
          }
        }
        if (!found) {
          console.error("MutationStateController.setStateElement: path array element is missing", path, part, i);
          return;
        }
      } else if (typeof object === 'object') {
        const subobject = object[part];
        if (subobject) {
          object = subobject;
        } else {
          object[part] = {};
          object = object[part];
        }
      } else {
        console.error("MutationStateController.setStateElement: intermediate path element is neither object nor array", path, part, i);
        return;
      }
    }
    if (typeof object !== 'object') {
      console.error("MutationStateController.setStateElement: path does not point to an object", path);
      return;
    }
    if (typeof value === 'undefined') {
      delete object[parts[parts.length - 1]];
    } else {
      object[parts[parts.length - 1]] = value;
    }
  }

  private copy(object: any): any {
    return JSON.parse(JSON.stringify(object));
  }

  private async sendMutation(mutationType: string, path: string, value?: any, recordId?: string, referenceId?: string, elementPath?: string): Promise<MutationMessage> {
    const mutation: Mutation = {
      mutationType: mutationType,
      path: path
    };
    if (value) {
      mutation.value = value;
    }
    if (recordId) {
      mutation.recordId = recordId;
    }
    if (referenceId) {
      mutation.referenceId = referenceId;
    }
    if (elementPath) {
      mutation.elementPath = elementPath;
    }
    const message = await this.host.sendMutation(mutation);
    return {
      details: mutation,
      message: message
    };
  }
}

export interface HostComponent {
  // Implementor must send message containing mutation to other cards and return timestamp and senderCode used
  sendMutation(mutation: Mutation): Promise<CardToCardMessage>;
  setProperty?(path: string, value: any): void;
  spliceArray?(path: string, index: number, removeCount: number, recordToInsert?: any): void;
  updateRecord?(path: string, recordId: string, index: number, updatedRecordValue: any, elementPath: string, elementValue: any): void;
  updateText?(path: string, value: string, caretUpdater: (position: number) => number): void;
}

export interface CardToCardMessage {
  timestamp: number;
  senderCode: number;
}

export interface Mutation {
  mutationType: string;
  path: string;
  value?: any;
  recordId?: string;
  referenceId?: string;
  elementPath?: string;
}

interface MutationMessage {
  details: Mutation;
  message: CardToCardMessage;
}

interface UndoableMutationMessage extends MutationMessage {
  undoValue: any;
  undoReferenceId: string;
}

export interface HasId {
  id: string;
}

(window as any).DistributedStateController = DistributedStateController;
