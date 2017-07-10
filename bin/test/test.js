"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../src/index");
var chai_1 = require("chai");
var state = {};
var TestHost = (function () {
    function TestHost(senderCode) {
        this.sentTimestamp = 0;
        this.lastMutationSent = null;
        this.lastPropertySetPath = null;
        this.lastPropertySetValue = null;
        this.lastTextPath = null;
        this.lastTextValue = null;
        this.splices = [];
        this.senderCode = senderCode;
    }
    TestHost.prototype.sendMutation = function (mutation) {
        return __awaiter(this, void 0, void 0, function () {
            var now, message;
            return __generator(this, function (_a) {
                this.lastMutationSent = mutation;
                now = Date.now();
                this.sentTimestamp = this.sentTimestamp ? Math.max(now, this.sentTimestamp + 1) : now;
                message = { timestamp: this.sentTimestamp, senderCode: this.senderCode };
                this.lastMutationMessage = message;
                return [2 /*return*/, message];
            });
        });
    };
    TestHost.prototype.setProperty = function (path, value) {
        this.lastPropertySetPath = path;
        this.lastPropertySetValue = value;
    };
    TestHost.prototype.spliceArray = function (path, index, removeCount, recordToInsert) {
        var info = {
            path: path,
            index: index,
            removeCount: removeCount,
            recordToInsert: recordToInsert
        };
        this.splices.push(info);
    };
    TestHost.prototype.updateText = function (path, value, updater) {
        this.lastTextPath = path;
        this.lastTextValue = value;
        this.lastTextUpdater = updater;
    };
    return TestHost;
}());
describe('Mutation-based shared state controller', function () {
    it('handles a simple property change correctly', testSimpleProperty);
    it('gets two controllers in sync for property changes', testSyncSimpleProperty);
    it('handles rollback/forward correctly for simple property change', testRollbackProperty);
    it('handles a simple array element insert', testArrayInsert);
    it('handles rollback for overlapping array element inserts', testArrayInsertRollback);
    it('handles a simple text change correctly', testSimpleText);
    it('handles synchronizing text changes correctly', testSyncText);
    it('handles text rollbacks', testTextRollback);
});
function testSimpleProperty() {
    return __awaiter(this, void 0, void 0, function () {
        var controller1, testHost1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller1 = new index_1.DistributedStateController();
                    testHost1 = new TestHost(1);
                    controller1.initialize(testHost1);
                    return [4 /*yield*/, controller1.updateProperty('apples', 1)];
                case 1:
                    _a.sent();
                    chai_1.expect(testHost1.lastMutationSent).to.not.be.null;
                    chai_1.expect(testHost1.lastMutationSent.mutationType).to.equal('property-update');
                    chai_1.expect(testHost1.lastMutationSent.path).to.equal('apples');
                    chai_1.expect(testHost1.lastMutationSent.value).to.equal(1);
                    chai_1.expect(testHost1.lastPropertySetPath).to.equal('apples');
                    chai_1.expect(testHost1.lastPropertySetValue).to.equal(1);
                    return [2 /*return*/];
            }
        });
    });
}
function testSyncSimpleProperty() {
    return __awaiter(this, void 0, void 0, function () {
        var controller1, testHost1, controller2, testHost2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller1 = new index_1.DistributedStateController();
                    testHost1 = new TestHost(1);
                    controller1.initialize(testHost1);
                    controller2 = new index_1.DistributedStateController();
                    testHost2 = new TestHost(2);
                    controller2.initialize(testHost2);
                    return [4 /*yield*/, controller1.updateProperty('bananas', 2)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage)];
                case 2:
                    _a.sent();
                    chai_1.expect(testHost2.lastPropertySetPath).to.equal('bananas');
                    chai_1.expect(testHost2.lastPropertySetValue).to.equal(2);
                    return [2 /*return*/];
            }
        });
    });
}
function testRollbackProperty() {
    return __awaiter(this, void 0, void 0, function () {
        var controller1, testHost1, mutation, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller1 = new index_1.DistributedStateController();
                    testHost1 = new TestHost(1);
                    controller1.initialize(testHost1);
                    return [4 /*yield*/, controller1.updateProperty('carrots', 3)];
                case 1:
                    _a.sent();
                    mutation = {
                        mutationType: 'property-update',
                        path: 'carrots',
                        value: 2
                    };
                    msg = {
                        senderCode: 2,
                        timestamp: testHost1.lastMutationMessage.timestamp - 1
                    };
                    return [4 /*yield*/, controller1.handleInboundMutation(mutation, msg)];
                case 2:
                    _a.sent();
                    chai_1.expect(testHost1.lastPropertySetPath).to.equal('carrots');
                    chai_1.expect(testHost1.lastPropertySetValue).to.equal(3);
                    return [2 /*return*/];
            }
        });
    });
}
function testArrayInsert() {
    return __awaiter(this, void 0, void 0, function () {
        var controller1, testHost1, controller2, testHost2, record;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller1 = new index_1.DistributedStateController();
                    testHost1 = new TestHost(1);
                    controller1.initialize(testHost1);
                    controller2 = new index_1.DistributedStateController();
                    testHost2 = new TestHost(2);
                    controller2.initialize(testHost2);
                    record = { name: "item1" };
                    return [4 /*yield*/, controller1.arrayInsert('items', record)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage)];
                case 2:
                    _a.sent();
                    chai_1.expect(testHost2.splices.length).to.equal(1);
                    chai_1.expect(testHost2.splices[0].path).to.equal('items');
                    chai_1.expect(testHost2.splices[0].index).to.equal(0);
                    chai_1.expect(testHost2.splices[0].removeCount).to.equal(0);
                    chai_1.expect(testHost2.splices[0].recordToInsert).to.deep.equals(record);
                    return [2 /*return*/];
            }
        });
    });
}
function testArrayInsertRollback() {
    return __awaiter(this, void 0, void 0, function () {
        var controller1, testHost1, record1, record2, mutation, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller1 = new index_1.DistributedStateController();
                    testHost1 = new TestHost(1);
                    controller1.initialize(testHost1);
                    record1 = { id: "1", name: "item1" };
                    record2 = { id: "2", name: "item2" };
                    return [4 /*yield*/, controller1.arrayInsert('items', record1)];
                case 1:
                    _a.sent();
                    mutation = {
                        mutationType: "array-insert",
                        path: 'items',
                        value: record2
                    };
                    msg = {
                        senderCode: 2,
                        timestamp: testHost1.lastMutationMessage.timestamp - 1
                    };
                    return [4 /*yield*/, controller1.handleInboundMutation(mutation, msg)];
                case 2:
                    _a.sent();
                    // Since the second one has an earlier timestamp, we expect to see the first
                    // mutation rolled back, then the second one applied, then the first one applied
                    // resulting in the array elements being ordered with item2 before item2
                    chai_1.expect(testHost1.splices.length).to.equal(4);
                    chai_1.expect(testHost1.splices[0].path).to.equal("items");
                    chai_1.expect(testHost1.splices[0].index).to.equal(0);
                    chai_1.expect(testHost1.splices[0].removeCount).to.equal(0);
                    chai_1.expect(testHost1.splices[0].recordToInsert).to.deep.equal(record1);
                    chai_1.expect(testHost1.splices[1].path).to.equal("items");
                    chai_1.expect(testHost1.splices[1].index).to.equal(0);
                    chai_1.expect(testHost1.splices[1].removeCount).to.equal(1);
                    chai_1.expect(testHost1.splices[1].recordToInsert).to.be.undefined;
                    chai_1.expect(testHost1.splices[2].path).to.equal("items");
                    chai_1.expect(testHost1.splices[2].index).to.equal(0);
                    chai_1.expect(testHost1.splices[2].removeCount).to.equal(0);
                    chai_1.expect(testHost1.splices[2].recordToInsert).to.deep.equal(record2);
                    chai_1.expect(testHost1.splices[3].path).to.equal("items");
                    chai_1.expect(testHost1.splices[3].index).to.equal(1);
                    chai_1.expect(testHost1.splices[3].removeCount).to.equal(0);
                    chai_1.expect(testHost1.splices[3].recordToInsert).to.deep.equal(record1);
                    return [2 /*return*/];
            }
        });
    });
}
function testSimpleText() {
    return __awaiter(this, void 0, void 0, function () {
        var controller1, testHost1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller1 = new index_1.DistributedStateController();
                    testHost1 = new TestHost(1);
                    controller1.initialize(testHost1);
                    return [4 /*yield*/, controller1.updateText('comment', "The quick brown fox")];
                case 1:
                    _a.sent();
                    chai_1.expect(testHost1.lastTextPath).to.equal('comment');
                    chai_1.expect(testHost1.lastTextValue).to.equal('The quick brown fox');
                    return [4 /*yield*/, controller1.updateText('comment', "The really quick brown ox")];
                case 2:
                    _a.sent();
                    chai_1.expect(testHost1.lastTextPath).to.equal('comment');
                    chai_1.expect(testHost1.lastTextValue).to.equal('The really quick brown ox');
                    chai_1.expect(testHost1.lastTextUpdater(0)).to.equal(0);
                    chai_1.expect(testHost1.lastTextUpdater(5)).to.equal(12);
                    chai_1.expect(testHost1.lastTextUpdater(17)).to.equal(23);
                    return [2 /*return*/];
            }
        });
    });
}
function testSyncText() {
    return __awaiter(this, void 0, void 0, function () {
        var controller1, testHost1, controller2, testHost2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller1 = new index_1.DistributedStateController();
                    testHost1 = new TestHost(1);
                    controller1.initialize(testHost1);
                    controller2 = new index_1.DistributedStateController();
                    testHost2 = new TestHost(2);
                    controller2.initialize(testHost2);
                    return [4 /*yield*/, controller1.updateText('comment', "The quick brown fox")];
                case 1:
                    _a.sent();
                    chai_1.expect(testHost1.lastTextPath).to.equal('comment');
                    chai_1.expect(testHost1.lastTextValue).to.equal('The quick brown fox');
                    return [4 /*yield*/, controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage)];
                case 2:
                    _a.sent();
                    chai_1.expect(testHost2.lastTextPath).to.equal('comment');
                    chai_1.expect(testHost2.lastTextValue).to.equal('The quick brown fox');
                    return [4 /*yield*/, controller2.updateText('comment', "The really quick brown ox")];
                case 3:
                    _a.sent();
                    chai_1.expect(testHost2.lastTextPath).to.equal('comment');
                    chai_1.expect(testHost2.lastTextValue).to.equal('The really quick brown ox');
                    return [4 /*yield*/, controller1.handleInboundMutation(testHost2.lastMutationSent, testHost2.lastMutationMessage)];
                case 4:
                    _a.sent();
                    chai_1.expect(testHost1.lastTextPath).to.equal('comment');
                    chai_1.expect(testHost1.lastTextValue).to.equal('The really quick brown ox');
                    return [2 /*return*/];
            }
        });
    });
}
function testTextRollback() {
    return __awaiter(this, void 0, void 0, function () {
        var controller1, testHost1, controller2, testHost2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller1 = new index_1.DistributedStateController();
                    testHost1 = new TestHost(1);
                    controller1.initialize(testHost1);
                    controller2 = new index_1.DistributedStateController();
                    testHost2 = new TestHost(2);
                    controller2.initialize(testHost2);
                    return [4 /*yield*/, controller1.updateText('comment', "The quick brown fox")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage)];
                case 2:
                    _a.sent();
                    // Both sides have 'the quick brown fox'
                    // Now both sides are going to make different changes concurrently
                    return [4 /*yield*/, controller2.updateText('comment', "The really quick brown fox")];
                case 3:
                    // Both sides have 'the quick brown fox'
                    // Now both sides are going to make different changes concurrently
                    _a.sent();
                    return [4 /*yield*/, controller1.updateText('comment', "The quick brown ox")];
                case 4:
                    _a.sent();
                    // Now we deliver the change made first from 2 to 1, so that 1 will have to rollback and then
                    // roll forward
                    return [4 /*yield*/, controller1.handleInboundMutation(testHost2.lastMutationSent, testHost2.lastMutationMessage)];
                case 5:
                    // Now we deliver the change made first from 2 to 1, so that 1 will have to rollback and then
                    // roll forward
                    _a.sent();
                    chai_1.expect(testHost1.lastTextPath).to.equal('comment');
                    chai_1.expect(testHost1.lastTextValue).to.equal('The really quick brown ox');
                    return [4 /*yield*/, controller2.handleInboundMutation(testHost1.lastMutationSent, testHost1.lastMutationMessage)];
                case 6:
                    _a.sent();
                    chai_1.expect(testHost2.lastTextPath).to.equal('comment');
                    chai_1.expect(testHost2.lastTextValue).to.equal('The really quick brown ox');
                    return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=test.js.map