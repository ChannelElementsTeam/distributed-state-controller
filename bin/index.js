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
var MutationStateController = (function () {
    function MutationStateController(host, channel, initialState) {
        this.state = {};
        this.history = [];
        this.host = host;
        this.channel = channel;
        if (initialState) {
            this.state = initialState;
        }
    }
    MutationStateController.prototype.updateProperty = function (path, value) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.channel.sendMutation('property-update', path, value)];
                    case 1:
                        message = _a.sent();
                        this.integrateMutation(message);
                        return [2 /*return*/];
                }
            });
        });
    };
    MutationStateController.prototype.arrayInsert = function (path, value, beforeId) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof value !== 'object') {
                            throw new Error("MutationStateController.addRecord: value must be object");
                        }
                        return [4 /*yield*/, this.channel.sendMutation('array-insert', path, value, value.id, beforeId)];
                    case 1:
                        message = _a.sent();
                        this.integrateMutation(message);
                        return [2 /*return*/];
                }
            });
        });
    };
    MutationStateController.prototype.arrayRemove = function (path, id) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.channel.sendMutation('array-remove', path, null, id)];
                    case 1:
                        message = _a.sent();
                        this.integrateMutation(message);
                        return [2 /*return*/];
                }
            });
        });
    };
    MutationStateController.prototype.arrayMove = function (path, id, beforeId) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.channel.sendMutation('array-move', path, null, id, beforeId)];
                    case 1:
                        message = _a.sent();
                        this.integrateMutation(message);
                        return [2 /*return*/];
                }
            });
        });
    };
    MutationStateController.prototype.arrayElementUpdate = function (path, id, internalPath, value) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.channel.sendMutation('array-element-update', path, value, id, null, internalPath)];
                    case 1:
                        message = _a.sent();
                        this.integrateMutation(message);
                        return [2 /*return*/];
                }
            });
        });
    };
    MutationStateController.prototype.handleInboundMutation = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.integrateMutation(message);
                return [2 /*return*/];
            });
        });
    };
    MutationStateController.prototype.integrateMutation = function (message) {
        var undoItems = [];
        // If we've already applied some mutations whose timestamps are later than this one being integrated, then we need to undo those first, and redo them afterward
        while (this.history.length > 0 && (this.history[this.history.length - 1].message.timestamp > message.timestamp || (this.history[this.history.length - 1].message.timestamp === message.timestamp && this.history[this.history.length - 1].message.senderCode > message.senderCode))) {
            var undoItem = this.history.pop();
            undoItems.push(undoItem);
            this.undoMutation(undoItem);
        }
        this.applyMutation(message);
        while (undoItems.length > 0) {
            var item = undoItems.shift();
            this.applyMutation(item.message);
        }
    };
    MutationStateController.prototype.applyMutation = function (message) {
        var mutationInfo;
        switch (message.mutationType) {
            case 'property-update':
                mutationInfo = this.doPropertyUpdate(message);
                break;
            case 'array-insert':
                mutationInfo = this.doArrayInsert(message);
                break;
            case 'array-remove':
                mutationInfo = this.doArrayRemove(message);
                break;
            case 'array-move':
                mutationInfo = this.doArrayMove(message);
                break;
            case 'array-element-update':
                mutationInfo = this.doArrayElementUpdate(message);
                break;
            default:
                console.error("MutationStateController: unhandled mutation type " + message.mutationType);
                return;
        }
        if (mutationInfo) {
            this.history.push(mutationInfo);
        }
    };
    MutationStateController.prototype.undoMutation = function (item) {
        switch (item.message.mutationType) {
            case 'property-update':
                this.undoPropertyUpdate(item);
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
            default:
                console.error("MutationStateController: unhandled mutation type " + item.message.mutationType);
                return;
        }
    };
    MutationStateController.prototype.doPropertyUpdate = function (message) {
        var previousValue = this.getStateElement(this.state, message.path);
        var mutationInfo = {
            message: message,
            undoValue: previousValue,
            undoReferenceId: null
        };
        this.setStateElement(this.state, message.path, message.value);
        this.host.setProperty(message.path, message.value);
        return mutationInfo;
    };
    MutationStateController.prototype.undoPropertyUpdate = function (item) {
        this.setStateElement(this.state, item.message.path, item.undoValue);
        this.host.setProperty(item.message.path, item.undoValue);
    };
    MutationStateController.prototype.doArrayInsert = function (message) {
        var mutationInfo = {
            message: message,
            undoValue: null,
            undoReferenceId: null
        };
        var array = this.getStateElement(this.state, message.path, true);
        if (!array) {
            console.error('MutationStateController: doArrayInsert: problem with array path');
            return null;
        }
        message.value.id = message.recordId;
        var found = false;
        var index;
        var beforeId;
        if (message.referenceId) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === message.referenceId) {
                    beforeId = i < array.length - 1 ? array[i + 1].id : null;
                    index = i;
                    array.splice(i, 0, message.value);
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
            array.push(message.value);
        }
        this.host.spliceRecord(message.path, index, 0, this.copy(message.value));
        return mutationInfo;
    };
    MutationStateController.prototype.undoArrayInsert = function (item) {
        var array = this.getStateElement(this.state, item.message.path, true);
        if (!array) {
            console.error('MutationStateController: undoArrayInsert: problem with array path');
            return null;
        }
        var index;
        var found = false;
        if (item.message.recordId) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === item.message.recordId) {
                    array.splice(i, 1);
                    index = i;
                    found = true;
                    break;
                }
            }
        }
        if (found) {
            this.host.spliceRecord(item.message.path, index, 1);
        }
        else {
            console.error('MutationStateController: undoArrayInsert: message recordId missing');
        }
    };
    MutationStateController.prototype.doArrayRemove = function (message) {
        var array = this.getStateElement(this.state, message.path, true);
        if (!array) {
            console.error('MutationStateController: doArrayRemove: problem with array path');
            return null;
        }
        var record;
        var index;
        var referenceId;
        for (var i = 0; i < array.length; i++) {
            if (array[i].id === message.recordId) {
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
        var mutationInfo = {
            message: message,
            undoValue: record,
            undoReferenceId: referenceId
        };
        this.host.spliceRecord(message.path, index, 1);
        return mutationInfo;
    };
    MutationStateController.prototype.undoArrayRemove = function (item) {
        var array = this.getStateElement(this.state, item.message.path, true);
        if (!array) {
            console.error('MutationStateController: undoArrayRemove: problem with array path');
            return null;
        }
        if (item.undoReferenceId) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === item.undoReferenceId) {
                    array.splice(i, 0, item.undoValue);
                    this.host.spliceRecord(item.message.path, i, 0, this.copy(item.undoValue));
                    break;
                }
            }
        }
        else {
            array.push(item.undoValue);
            this.host.spliceRecord(item.message.path, array.length, 0, this.copy(item.undoValue));
        }
    };
    MutationStateController.prototype.doArrayMove = function (message) {
        var array = this.getStateElement(this.state, message.path, true);
        if (!array) {
            console.error('MutationStateController: doArrayMove: problem with array path');
            return null;
        }
        var record;
        var fromIndex;
        var originalBeforeId;
        for (var i = 0; i < array.length; i++) {
            if (array[i].id === message.recordId) {
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
        if (message.referenceId) {
            var found = false;
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === message.referenceId) {
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
        var mutationInfo = {
            message: message,
            undoValue: record,
            undoReferenceId: originalBeforeId
        };
        this.host.spliceRecord(message.path, fromIndex, 1);
        this.host.spliceRecord(message.path, toIndex, 0, this.copy(record));
        return mutationInfo;
    };
    MutationStateController.prototype.undoArrayMove = function (item) {
        var array = this.getStateElement(this.state, item.message.path, true);
        if (!array) {
            console.error('MutationStateController: undoArrayMove: problem with array path');
            return null;
        }
        var record;
        var fromIndex;
        var originalBeforeId;
        for (var i = 0; i < array.length; i++) {
            if (array[i].id === item.message.recordId) {
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
        if (item.undoReferenceId) {
            var found = false;
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === item.undoReferenceId) {
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
        this.host.spliceRecord(item.message.path, fromIndex, 1);
        this.host.spliceRecord(item.message.path, toIndex, 0, this.copy(record));
    };
    MutationStateController.prototype.doArrayElementUpdate = function (message) {
        var array = this.getStateElement(this.state, message.path, true);
        if (!array) {
            console.error('MutationStateController: doArrayElementUpdate: problem with array path');
            return null;
        }
        var record;
        var index;
        for (var i = 0; i < array.length; i++) {
            if (array[i].id === message.recordId) {
                record = array[i];
                index = i;
                break;
            }
        }
        if (!record) {
            console.error('MutationStateController: doArrayElementUpdate: recordId not found');
            return null;
        }
        var previousValue = this.getStateElement(record, message.elementPath);
        var mutationInfo = {
            message: message,
            undoValue: previousValue,
            undoReferenceId: null
        };
        this.setStateElement(record, message.elementPath, message.value);
        this.host.updateRecord(message.path, record.id, index, record, message.elementPath, message.value);
        return mutationInfo;
    };
    MutationStateController.prototype.undoArrayElementUpdate = function (item) {
        var array = this.getStateElement(this.state, item.message.path, true);
        if (!array) {
            console.error('MutationStateController: undoArrayElementUpdate: problem with array path');
            return null;
        }
        var record;
        var index;
        for (var i = 0; i < array.length; i++) {
            if (array[i].id === item.message.recordId) {
                record = array[i];
                index = i;
                break;
            }
        }
        if (!record) {
            console.error('MutationStateController: undoArrayElementUpdate: recordId not found');
            return null;
        }
        this.setStateElement(record, item.message.elementPath, item.undoValue);
        this.host.updateRecord(item.message.path, record.id, index, record, item.message.elementPath, item.undoValue);
    };
    MutationStateController.prototype.getStateElement = function (state, path, isArray) {
        if (isArray === void 0) { isArray = false; }
        var object = state;
        var parts = path.split('.');
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (typeof object === 'object') {
                if (!object[part]) {
                    object[part] = {};
                }
                object = object[part];
            }
            else if (i < parts.length - 1) {
                console.warn("MutationStateController.getStateElement: intermediate path element is not object", path, part, i);
                return undefined;
            }
            else {
                if (object[part]) {
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
    MutationStateController.prototype.setStateElement = function (state, path, value) {
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
    MutationStateController.prototype.copy = function (object) {
        return JSON.parse(JSON.stringify(object));
    };
    return MutationStateController;
}());
exports.MutationStateController = MutationStateController;
//# sourceMappingURL=index.js.map