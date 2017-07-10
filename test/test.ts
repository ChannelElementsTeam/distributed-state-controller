import { DistributedStateController, HostComponent, Mutation, CardToCardMessage } from "../src/index";
import { expect } from 'chai';

const state = {};

class TestHost implements HostComponent {
  sentTimestamp = 0;
  senderCode: number;
  lastMutationSent: Mutation = null;
  lastMutationMessage: CardToCardMessage;
  lastPropertySetPath: string = null;
  lastPropertySetValue: any = null;
  lastTextPath: string = null;
  lastTextValue: string = null;
  lastTextUpdater: (position: number) => number;

  splices: SpliceInfo[] = [];

  constructor(senderCode: number) {
    this.senderCode = senderCode;
  }

  async sendMutation(mutation: Mutation): Promise<CardToCardMessage> {
    this.lastMutationSent = mutation;
    const now = Date.now();
    this.sentTimestamp = this.sentTimestamp ? Math.max(now, this.sentTimestamp + 1) : now;
    const message: CardToCardMessage = { timestamp: this.sentTimestamp, senderCode: this.senderCode };
    this.lastMutationMessage = message;
    return message;
  }

  setProperty(path: string, value: any): void {
    this.lastPropertySetPath = path;
    this.lastPropertySetValue = value;
  }

  spliceArray(path: string, index: number, removeCount: number, recordToInsert?: any): void {
    const info: SpliceInfo = {
      path: path,
      index: index,
      removeCount: removeCount,
      recordToInsert: recordToInsert
    };
    this.splices.push(info);
  }

  updateText(path: string, value: string, updater: (position: number) => number): void {
    this.lastTextPath = path;
    this.lastTextValue = value;
    this.lastTextUpdater = updater;
  }
}

describe('Mutation-based shared state controller', () => {
  it('handles a simple property change correctly', testSimpleProperty);
  it('gets two controllers in sync for property changes', testSyncSimpleProperty);
  it('handles rollback/forward correctly for simple property change', testRollbackProperty);
  it('handles a simple array element insert', testArrayInsert);
  it('handles rollback for overlapping array element inserts', testArrayInsertRollback);
  it('handles a simple text change correctly', testSimpleText);
  it('handles synchronizing text changes correctly', testSyncText);
  it('handles text rollbacks', testTextRollback);
});

async function testSimpleProperty(): Promise<void> {
  const controller1 = new DistributedStateController();
  const testHost1 = new TestHost(1);
  controller1.initialize(testHost1);
  await controller1.updateProperty('apples', 1);
  expect(testHost1.lastMutationSent).to.not.be.null;
  expect(testHost1.lastMutationSent.mutationType).to.equal('property-update');
  expect(testHost1.lastMutationSent.path).to.equal('apples');
  expect(testHost1.lastMutationSent.value).to.equal(1);
  expect(testHost1.lastPropertySetPath).to.equal('apples');
  expect(testHost1.lastPropertySetValue).to.equal(1);
}

async function testSyncSimpleProperty(): Promise<void> {
  const controller1 = new DistributedStateController();
  const testHost1 = new TestHost(1);
  controller1.initialize(testHost1);

  const controller2 = new DistributedStateController();
  const testHost2 = new TestHost(2);
  controller2.initialize(testHost2);

  await controller1.updateProperty('bananas', 2);
  await controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage);
  expect(testHost2.lastPropertySetPath).to.equal('bananas');
  expect(testHost2.lastPropertySetValue).to.equal(2);
}

async function testRollbackProperty(): Promise<void> {
  const controller1 = new DistributedStateController();
  const testHost1 = new TestHost(1);
  controller1.initialize(testHost1);

  await controller1.updateProperty('carrots', 3);
  const mutation: Mutation = {
    mutationType: 'property-update',
    path: 'carrots',
    value: 2
  };
  const msg: CardToCardMessage = {
    senderCode: 2,
    timestamp: testHost1.lastMutationMessage.timestamp - 1
  };
  await controller1.handleInboundMutation(mutation, msg);
  expect(testHost1.lastPropertySetPath).to.equal('carrots');
  expect(testHost1.lastPropertySetValue).to.equal(3);
  // This is because the rollback should happen because of the earlier timestamp,
  // then the second mutation is processed first, then the original mutation reprocessed
  // which should arrive back at the original value of 3
}

async function testArrayInsert(): Promise<void> {
  const controller1 = new DistributedStateController();
  const testHost1 = new TestHost(1);
  controller1.initialize(testHost1);

  const controller2 = new DistributedStateController();
  const testHost2 = new TestHost(2);
  controller2.initialize(testHost2);

  const record = { name: "item1" };
  await controller1.arrayInsert('items', record);
  await controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage);
  expect(testHost2.splices.length).to.equal(1);
  expect(testHost2.splices[0].path).to.equal('items');
  expect(testHost2.splices[0].index).to.equal(0);
  expect(testHost2.splices[0].removeCount).to.equal(0);
  expect(testHost2.splices[0].recordToInsert).to.deep.equals(record);
}

async function testArrayInsertRollback(): Promise<void> {
  const controller1 = new DistributedStateController();
  const testHost1 = new TestHost(1);
  controller1.initialize(testHost1);

  const record1 = { id: "1", name: "item1" };
  const record2 = { id: "2", name: "item2" };
  await controller1.arrayInsert('items', record1);
  const mutation: Mutation = {
    mutationType: "array-insert",
    path: 'items',
    value: record2
  };
  const msg: CardToCardMessage = {
    senderCode: 2,
    timestamp: testHost1.lastMutationMessage.timestamp - 1
  };
  await controller1.handleInboundMutation(mutation, msg);
  // Since the second one has an earlier timestamp, we expect to see the first
  // mutation rolled back, then the second one applied, then the first one applied
  // resulting in the array elements being ordered with item2 before item2
  expect(testHost1.splices.length).to.equal(4);
  expect(testHost1.splices[0].path).to.equal("items");
  expect(testHost1.splices[0].index).to.equal(0);
  expect(testHost1.splices[0].removeCount).to.equal(0);
  expect(testHost1.splices[0].recordToInsert).to.deep.equal(record1);
  expect(testHost1.splices[1].path).to.equal("items");
  expect(testHost1.splices[1].index).to.equal(0);
  expect(testHost1.splices[1].removeCount).to.equal(1);
  expect(testHost1.splices[1].recordToInsert).to.be.undefined;
  expect(testHost1.splices[2].path).to.equal("items");
  expect(testHost1.splices[2].index).to.equal(0);
  expect(testHost1.splices[2].removeCount).to.equal(0);
  expect(testHost1.splices[2].recordToInsert).to.deep.equal(record2);
  expect(testHost1.splices[3].path).to.equal("items");
  expect(testHost1.splices[3].index).to.equal(1);
  expect(testHost1.splices[3].removeCount).to.equal(0);
  expect(testHost1.splices[3].recordToInsert).to.deep.equal(record1);
}

async function testSimpleText(): Promise<void> {
  const controller1 = new DistributedStateController();
  const testHost1 = new TestHost(1);
  controller1.initialize(testHost1);
  await controller1.updateText('comment', "The quick brown fox");
  expect(testHost1.lastTextPath).to.equal('comment');
  expect(testHost1.lastTextValue).to.equal('The quick brown fox');
  await controller1.updateText('comment', "The really quick brown ox");
  expect(testHost1.lastTextPath).to.equal('comment');
  expect(testHost1.lastTextValue).to.equal('The really quick brown ox');
  expect(testHost1.lastTextUpdater(0)).to.equal(0);
  expect(testHost1.lastTextUpdater(5)).to.equal(12);
  expect(testHost1.lastTextUpdater(17)).to.equal(23);
}

async function testSyncText(): Promise<void> {
  const controller1 = new DistributedStateController();
  const testHost1 = new TestHost(1);
  controller1.initialize(testHost1);

  const controller2 = new DistributedStateController();
  const testHost2 = new TestHost(2);
  controller2.initialize(testHost2);

  await controller1.updateText('comment', "The quick brown fox");
  expect(testHost1.lastTextPath).to.equal('comment');
  expect(testHost1.lastTextValue).to.equal('The quick brown fox');
  await controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage);
  expect(testHost2.lastTextPath).to.equal('comment');
  expect(testHost2.lastTextValue).to.equal('The quick brown fox');
  await controller2.updateText('comment', "The really quick brown ox");
  expect(testHost2.lastTextPath).to.equal('comment');
  expect(testHost2.lastTextValue).to.equal('The really quick brown ox');
  await controller1.handleInboundMutation(testHost2.lastMutationSent, testHost2.lastMutationMessage);
  expect(testHost1.lastTextPath).to.equal('comment');
  expect(testHost1.lastTextValue).to.equal('The really quick brown ox');
}

async function testTextRollback(): Promise<void> {
  const controller1 = new DistributedStateController();
  const testHost1 = new TestHost(1);
  controller1.initialize(testHost1);

  const controller2 = new DistributedStateController();
  const testHost2 = new TestHost(2);
  controller2.initialize(testHost2);

  await controller1.updateText('comment', "The quick brown fox");
  await controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage);

  // Both sides have 'the quick brown fox'
  // Now both sides are going to make different changes concurrently
  await controller2.updateText('comment', "The really quick brown fox");
  await controller1.updateText('comment', "The quick brown ox");

  // Now we deliver the change made first from 2 to 1, so that 1 will have to rollback and then
  // roll forward

  await controller1.handleInboundMutation(testHost2.lastMutationSent, testHost2.lastMutationMessage);
  expect(testHost1.lastTextPath).to.equal('comment');
  expect(testHost1.lastTextValue).to.equal('The really quick brown ox');

  await controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage);
  expect(testHost2.lastTextPath).to.equal('comment');
  expect(testHost2.lastTextValue).to.equal('The really quick brown ox');
}

interface SpliceInfo {
  path: string;
  index: number;
  removeCount: number;
  recordToInsert: any;
}
