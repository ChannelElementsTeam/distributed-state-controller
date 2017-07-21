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
var uuid = require('uuid');
var diff_match_patch_1 = require("diff-match-patch");
var DistributedStateController = (function () {
    function DistributedStateController() {
        this.state = {};
        this.history = [];
    }
    DistributedStateController.prototype.initialize = function (host, initialState) {
        this.host = host;
        if (initialState) {
            this.state = this.copy(initialState);
        }
    };
    DistributedStateController.prototype.updateProperty = function (path, value) {
        return __awaiter(this, void 0, void 0, function () {
            var mutation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendMutation('property-update', path, value)];
                    case 1:
                        mutation = _a.sent();
                        this.integrateMutation(mutation);
                        return [2 /*return*/];
                }
            });
        });
    };
    DistributedStateController.prototype.incrementProperty = function (path, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var mutation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendMutation('property-increment', path, amount)];
                    case 1:
                        mutation = _a.sent();
                        this.integrateMutation(mutation);
                        return [2 /*return*/];
                }
            });
        });
    };
    DistributedStateController.prototype.arrayInsert = function (path, value, beforeId) {
        return __awaiter(this, void 0, void 0, function () {
            var mutation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof value !== 'object') {
                            throw new Error("MutationStateController.addRecord: value must be object");
                        }
                        if (!value.id) {
                            value.id = uuid.v4();
                        }
                        return [4 /*yield*/, this.sendMutation('array-insert', path, value, value.id, beforeId)];
                    case 1:
                        mutation = _a.sent();
                        this.integrateMutation(mutation);
                        return [2 /*return*/];
                }
            });
        });
    };
    DistributedStateController.prototype.arrayRemove = function (path, id) {
        return __awaiter(this, void 0, void 0, function () {
            var mutation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendMutation('array-remove', path, null, id)];
                    case 1:
                        mutation = _a.sent();
                        this.integrateMutation(mutation);
                        return [2 /*return*/];
                }
            });
        });
    };
    DistributedStateController.prototype.arrayMove = function (path, id, beforeId) {
        return __awaiter(this, void 0, void 0, function () {
            var mutation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendMutation('array-move', path, null, id, beforeId)];
                    case 1:
                        mutation = _a.sent();
                        this.integrateMutation(mutation);
                        return [2 /*return*/];
                }
            });
        });
    };
    DistributedStateController.prototype.arrayElementUpdate = function (path, id, internalPath, value) {
        return __awaiter(this, void 0, void 0, function () {
            var mutation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendMutation('array-element-update', path, value, id, null, internalPath)];
                    case 1:
                        mutation = _a.sent();
                        this.integrateMutation(mutation);
                        return [2 /*return*/];
                }
            });
        });
    };
    DistributedStateController.prototype.updateText = function (path, updatedValue) {
        return __awaiter(this, void 0, void 0, function () {
            var dmp, previousValue, patches, patchString, mutation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dmp = new diff_match_patch_1.diff_match_patch();
                        previousValue = this.getStateElement(this.state, path) || '';
                        patches = dmp.patch_make(previousValue, updatedValue);
                        patchString = dmp.patch_toText(patches);
                        return [4 /*yield*/, this.sendMutation('text-update', path, patchString)];
                    case 1:
                        mutation = _a.sent();
                        this.integrateMutation(mutation);
                        return [2 /*return*/];
                }
            });
        });
    };
    DistributedStateController.prototype.handleInboundMutation = function (mutation, messageInfo) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.integrateMutation({ details: mutation, message: messageInfo });
                return [2 /*return*/];
            });
        });
    };
    DistributedStateController.prototype.integrateMutation = function (mutation) {
        var undoItems = [];
        // If we've already applied some mutations whose timestamps are later than this one being integrated, then we need to undo those first, and redo them afterward
        while (this.history.length > 0 && (this.history[this.history.length - 1].message.timestamp > mutation.message.timestamp || (this.history[this.history.length - 1].message.timestamp === mutation.message.timestamp && this.history[this.history.length - 1].message.senderCode > mutation.message.senderCode))) {
            var undoItem = this.history.pop();
            undoItems.push(undoItem);
            this.undoMutation(undoItem);
        }
        this.applyMutation(mutation);
        while (undoItems.length > 0) {
            var item = undoItems.shift();
            this.applyMutation(item);
        }
    };
    DistributedStateController.prototype.applyMutation = function (mutation) {
        var mutationInfo;
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
    };
    DistributedStateController.prototype.undoMutation = function (item) {
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
    };
    DistributedStateController.prototype.doPropertyUpdate = function (item) {
        var previousValue = this.getStateElement(this.state, item.details.path);
        var undoable = {
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
    };
    DistributedStateController.prototype.undoPropertyUpdate = function (undoable) {
        this.setStateElement(this.state, undoable.details.path, undoable.undoValue);
        if (this.host.setProperty) {
            this.host.setProperty(undoable.details.path, undoable.undoValue);
        }
    };
    DistributedStateController.prototype.doPropertyIncrement = function (item) {
        var previousValue = this.getStateElement(this.state, item.details.path);
        if (!previousValue || Number.isNaN(previousValue)) {
            previousValue = 0;
        }
        var undoable = {
            message: item.message,
            details: item.details,
            undoValue: previousValue,
            undoReferenceId: null
        };
        var value = item.details.value && !Number.isNaN(item.details.value) ? item.details.value : 0;
        this.setStateElement(this.state, item.details.path, value + previousValue);
        if (this.host.setProperty) {
            this.host.setProperty(item.details.path, value + previousValue);
        }
        return undoable;
    };
    DistributedStateController.prototype.undoPropertyIncrement = function (undoable) {
        this.setStateElement(this.state, undoable.details.path, undoable.undoValue);
        if (this.host.setProperty) {
            this.host.setProperty(undoable.details.path, undoable.undoValue);
        }
    };
    DistributedStateController.prototype.doArrayInsert = function (item) {
        var mutationInfo = {
            message: item.message,
            details: item.details,
            undoValue: null,
            undoReferenceId: null
        };
        var array = this.getStateElement(this.state, item.details.path, true);
        if (!array) {
            console.error('MutationStateController: doArrayInsert: problem with array path');
            return null;
        }
        if (item.details.recordId) {
            item.details.value.id = item.details.recordId;
        }
        else if (item.details.value.id) {
            item.details.recordId = item.details.value.id;
        }
        else {
            console.error('MutationStateController.doArrayInsert: recordId is missing and record has no ID');
            return null;
        }
        var found = false;
        var index;
        var beforeId;
        if (item.details.referenceId) {
            for (var i = 0; i < array.length; i++) {
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
        }
        else {
            index = array.length;
            array.push(item.details.value);
        }
        if (this.host.spliceArray) {
            this.host.spliceArray(item.details.path, index, 0, this.copy(item.details.value));
        }
        return mutationInfo;
    };
    DistributedStateController.prototype.undoArrayInsert = function (undoable) {
        var array = this.getStateElement(this.state, undoable.details.path, true);
        if (!array) {
            console.error('MutationStateController: undoArrayInsert: problem with array path');
            return null;
        }
        var index;
        var found = false;
        if (undoable.details.recordId) {
            for (var i = 0; i < array.length; i++) {
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
        }
        else {
            console.error('MutationStateController: undoArrayInsert: message recordId missing');
        }
    };
    DistributedStateController.prototype.doArrayRemove = function (item) {
        var array = this.getStateElement(this.state, item.details.path, true);
        if (!array) {
            console.error('MutationStateController: doArrayRemove: problem with array path');
            return null;
        }
        var record;
        var index;
        var referenceId;
        for (var i = 0; i < array.length; i++) {
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
        var undoable = {
            message: item.message,
            details: item.details,
            undoValue: record,
            undoReferenceId: referenceId
        };
        if (this.host.spliceArray) {
            this.host.spliceArray(item.details.path, index, 1);
        }
        return undoable;
    };
    DistributedStateController.prototype.undoArrayRemove = function (undoable) {
        var array = this.getStateElement(this.state, undoable.details.path, true);
        if (!array) {
            console.error('MutationStateController: undoArrayRemove: problem with array path');
            return null;
        }
        if (undoable.undoReferenceId) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === undoable.undoReferenceId) {
                    array.splice(i, 0, undoable.undoValue);
                    this.host.spliceArray(undoable.details.path, i, 0, this.copy(undoable.undoValue));
                    break;
                }
            }
        }
        else {
            array.push(undoable.undoValue);
            if (this.host.spliceArray) {
                this.host.spliceArray(undoable.details.path, array.length, 0, this.copy(undoable.undoValue));
            }
        }
    };
    DistributedStateController.prototype.doArrayMove = function (item) {
        var array = this.getStateElement(this.state, item.details.path, true);
        if (!array) {
            console.error('MutationStateController: doArrayMove: problem with array path');
            return null;
        }
        var record;
        var fromIndex;
        var originalBeforeId;
        for (var i = 0; i < array.length; i++) {
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
        var toIndex;
        var newBeforeId;
        if (item.details.referenceId) {
            var found = false;
            for (var i = 0; i < array.length; i++) {
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
        }
        else {
            toIndex = array.length;
            array.push(record);
        }
        var undoable = {
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
    };
    DistributedStateController.prototype.undoArrayMove = function (undoable) {
        var array = this.getStateElement(this.state, undoable.details.path, true);
        if (!array) {
            console.error('MutationStateController: undoArrayMove: problem with array path');
            return null;
        }
        var record;
        var fromIndex;
        var originalBeforeId;
        for (var i = 0; i < array.length; i++) {
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
        var toIndex;
        var newBeforeId;
        if (undoable.undoReferenceId) {
            var found = false;
            for (var i = 0; i < array.length; i++) {
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
        }
        else {
            toIndex = array.length;
            array.push(record);
        }
        if (this.host.spliceArray) {
            this.host.spliceArray(undoable.details.path, fromIndex, 1);
            this.host.spliceArray(undoable.details.path, toIndex, 0, this.copy(record));
        }
    };
    DistributedStateController.prototype.doArrayElementUpdate = function (item) {
        var array = this.getStateElement(this.state, item.details.path, true);
        if (!array) {
            console.error('MutationStateController: doArrayElementUpdate: problem with array path');
            return null;
        }
        var record;
        var index;
        for (var i = 0; i < array.length; i++) {
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
        var previousValue = this.getStateElement(record, item.details.elementPath);
        var undoable = {
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
    };
    DistributedStateController.prototype.undoArrayElementUpdate = function (undoable) {
        var array = this.getStateElement(this.state, undoable.details.path, true);
        if (!array) {
            console.error('MutationStateController: undoArrayElementUpdate: problem with array path');
            return null;
        }
        var record;
        var index;
        for (var i = 0; i < array.length; i++) {
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
    };
    DistributedStateController.prototype.doTextUpdate = function (item) {
        var previousValue = this.getStateElement(this.state, item.details.path) || '';
        var patchString = item.details.value;
        var dmp = new diff_match_patch_1.diff_match_patch();
        var patches = dmp.patch_fromText(patchString);
        var newValue = dmp.patch_apply(patches, previousValue)[0];
        var undoPatches = dmp.patch_make(newValue, previousValue);
        var undoString = dmp.patch_toText(undoPatches);
        var undoable = {
            message: item.message,
            details: item.details,
            undoValue: undoString,
            undoReferenceId: null
        };
        this.setStateElement(this.state, item.details.path, newValue);
        if (this.host.updateText) {
            var updater = this.getCaretUpdater(patches);
            this.host.updateText(item.details.path, newValue, updater);
        }
        return undoable;
    };
    DistributedStateController.prototype.undoTextUpdate = function (undoable) {
        var currentValue = this.getStateElement(this.state, undoable.details.path) || '';
        var patchString = undoable.details.value;
        var dmp = new diff_match_patch_1.diff_match_patch();
        var patches = dmp.patch_fromText(patchString);
        var originalValue = dmp.patch_apply(patches, currentValue)[0];
        this.setStateElement(this.state, undoable.details.path, originalValue);
        if (this.host.updateText) {
            var updater = this.getCaretUpdater(patches);
            this.host.updateText(undoable.details.path, originalValue, updater);
        }
    };
    // This helps with a client who is editing text as to what to do with the current
    // caret (cursor) position when a change happens.  Depending on where there are
    // inserts and deletes relative to the caret position, it may move forward or
    // backward.
    DistributedStateController.prototype.getCaretUpdater = function (patches) {
        return function (position) {
            var offset = 0;
            var position1 = 0;
            var position2 = 0;
            for (var _i = 0, patches_1 = patches; _i < patches_1.length; _i++) {
                var patch = patches_1[_i];
                for (var _a = 0, _b = patch.diffs; _a < _b.length; _a++) {
                    var diff = _b[_a];
                    switch (diff[0]) {
                        case 0:
                            if (position < position1 + diff[1].length) {
                                offset += position - position1;
                                return offset;
                            }
                            position1 += diff[1].length;
                            position2 += diff[1].length;
                            offset += diff[1].length;
                            break;
                        case -1:
                            if (position < position1 + diff[1].length) {
                                offset -= position - position1;
                                return offset;
                            }
                            position1 += diff[1].length;
                            break;
                        case 1:
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
    };
    DistributedStateController.prototype.getStateElement = function (state, path, isArray) {
        if (isArray === void 0) { isArray = false; }
        var object = state;
        var parts = path.split('.');
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (typeof object === 'object') {
                if (!object[part]) {
                    object[part] = i < parts.length - 1 ? {} : (isArray ? [] : null);
                }
                object = object[part];
            }
            else if (i < parts.length - 1) {
                console.warn("MutationStateController.getStateElement: intermediate path element is not object", path, part, i);
                return undefined;
            }
            else {
                if (typeof object[part] !== 'undefined') {
                    object = object[part];
                }
                else if (isArray) {
                    object[part] = [];
                    object = object[part];
                }
            }
        }
        if (isArray) {
            if (Array.isArray(object)) {
                return object;
            }
            else {
                return null;
            }
        }
        else {
            return object;
        }
    };
    DistributedStateController.prototype.setStateElement = function (state, path, value) {
        var parts = path.split('.');
        var object = state;
        for (var i = 0; i < parts.length - 1; i++) {
            var part = parts[i];
            if (!object) {
                object = {};
            }
            if (Array.isArray(object)) {
                var found = false;
                for (var _i = 0, object_1 = object; _i < object_1.length; _i++) {
                    var element = object_1[_i];
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
            }
            else if (typeof object === 'object') {
                var subobject = object[part];
                if (subobject) {
                    object = subobject;
                }
                else {
                    object[part] = {};
                    object = object[part];
                }
            }
            else {
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
        }
        else {
            object[parts[parts.length - 1]] = value;
        }
    };
    DistributedStateController.prototype.copy = function (object) {
        return JSON.parse(JSON.stringify(object));
    };
    DistributedStateController.prototype.sendMutation = function (mutationType, path, value, recordId, referenceId, elementPath) {
        return __awaiter(this, void 0, void 0, function () {
            var mutation, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mutation = {
                            mutationType: mutationType,
                            path: path
                        };
                        if (typeof value !== 'undefined') {
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
                        return [4 /*yield*/, this.host.sendMutation(mutation)];
                    case 1:
                        message = _a.sent();
                        return [2 /*return*/, {
                                details: mutation,
                                message: message
                            }];
                }
            });
        });
    };
    return DistributedStateController;
}());
exports.DistributedStateController = DistributedStateController;
window.DistributedStateController = DistributedStateController;
//# sourceMappingURL=index.js.map