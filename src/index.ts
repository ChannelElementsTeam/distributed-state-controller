export class MutationStateController {
  private host: HostComponent;
  private channel: MutationChannel;
  private state: any = {};
  private history: MutationInfo[] = [];

  constructor(host: HostComponent, channel: MutationChannel, initialState?: any) {
    this.host = host;
    this.channel = channel;
    if (initialState) {
      this.state = initialState;
    }
  }

  async updateProperty(path: string, value: any): Promise<void> {
    const message = await this.channel.sendMutation('property-update', path, value);
    this.integrateMutation(message);
  }

  async arrayInsert(path: string, value: HasId, beforeId?: string): Promise<void> {
    if (typeof value !== 'object') {
      throw new Error("MutationStateController.addRecord: value must be object");
    }
    const message = await this.channel.sendMutation('array-insert', path, value, value.id, beforeId);
    this.integrateMutation(message);
  }

  async arrayRemove(path: string, id: string): Promise<void> {
    const message = await this.channel.sendMutation('array-remove', path, null, id);
    this.integrateMutation(message);
  }

  async arrayMove(path: string, id: string, beforeId: string): Promise<void> {
    const message = await this.channel.sendMutation('array-move', path, null, id, beforeId);
    this.integrateMutation(message);
  }

  async arrayElementUpdate(path: string, id: string, internalPath: string, value: any): Promise<void> {
    const message = await this.channel.sendMutation('array-element-update', path, value, id, null, internalPath);
    this.integrateMutation(message);
  }

  async handleInboundMutation(message: MutationMessage): Promise<void> {
    this.integrateMutation(message);
  }

  private integrateMutation(message: MutationMessage): void {
    const undoItems: MutationInfo[] = [];
    // If we've already applied some mutations whose timestamps are later than this one being integrated, then we need to undo those first, and redo them afterward
    while (this.history.length > 0 && (this.history[this.history.length - 1].message.timestamp > message.timestamp || (this.history[this.history.length - 1].message.timestamp === message.timestamp && this.history[this.history.length - 1].message.senderCode > message.senderCode))) {
      const undoItem = this.history.pop();
      undoItems.push(undoItem);
      this.undoMutation(undoItem);
    }
    this.applyMutation(message);
    while (undoItems.length > 0) {
      const item = undoItems.shift();
      this.applyMutation(item.message);
    }
  }

  private applyMutation(message: MutationMessage): void {
    let mutationInfo: MutationInfo;
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
  }

  private undoMutation(item: MutationInfo): void {
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
  }

  private doPropertyUpdate(message: MutationMessage): MutationInfo {
    const previousValue = this.getStateElement(this.state, message.path);
    const mutationInfo: MutationInfo = {
      message: message,
      undoValue: previousValue,
      undoReferenceId: null
    };
    this.setStateElement(this.state, message.path, message.value);
    this.host.setProperty(message.path, message.value);
    return mutationInfo;
  }

  private undoPropertyUpdate(item: MutationInfo): void {
    this.setStateElement(this.state, item.message.path, item.undoValue);
    this.host.setProperty(item.message.path, item.undoValue);
  }

  private doArrayInsert(message: MutationMessage): MutationInfo {
    const mutationInfo: MutationInfo = {
      message: message,
      undoValue: null,
      undoReferenceId: null
    };
    const array = this.getStateElement(this.state, message.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: doArrayInsert: problem with array path');
      return null;
    }
    message.value.id = message.recordId;
    let found = false;
    let index: number;
    let beforeId: string;
    if (message.referenceId) {
      for (let i = 0; i < array.length; i++) {
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
    } else {
      index = array.length;
      array.push(message.value);
    }
    this.host.spliceRecord(message.path, index, 0, this.copy(message.value));
    return mutationInfo;
  }

  private undoArrayInsert(item: MutationInfo): void {
    const array = this.getStateElement(this.state, item.message.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: undoArrayInsert: problem with array path');
      return null;
    }
    let index: number;
    let found = false;
    if (item.message.recordId) {
      for (let i = 0; i < array.length; i++) {
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
    } else {
      console.error('MutationStateController: undoArrayInsert: message recordId missing');
    }
  }

  private doArrayRemove(message: MutationMessage): MutationInfo {
    const array = this.getStateElement(this.state, message.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: doArrayRemove: problem with array path');
      return null;
    }
    let record: HasId;
    let index: number;
    let referenceId: string;
    for (let i = 0; i < array.length; i++) {
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
    const mutationInfo: MutationInfo = {
      message: message,
      undoValue: record,
      undoReferenceId: referenceId
    };
    this.host.spliceRecord(message.path, index, 1);
    return mutationInfo;
  }

  private undoArrayRemove(item: MutationInfo): void {
    const array = this.getStateElement(this.state, item.message.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: undoArrayRemove: problem with array path');
      return null;
    }
    if (item.undoReferenceId) {
      for (let i = 0; i < array.length; i++) {
        if (array[i].id === item.undoReferenceId) {
          array.splice(i, 0, item.undoValue);
          this.host.spliceRecord(item.message.path, i, 0, this.copy(item.undoValue));
          break;
        }
      }
    } else {
      array.push(item.undoValue);
      this.host.spliceRecord(item.message.path, array.length, 0, this.copy(item.undoValue));
    }
  }

  private doArrayMove(message: MutationMessage): MutationInfo {
    const array = this.getStateElement(this.state, message.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: doArrayMove: problem with array path');
      return null;
    }
    let record: HasId;
    let fromIndex: number;
    let originalBeforeId: string;
    for (let i = 0; i < array.length; i++) {
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
    let toIndex: number;
    let newBeforeId: string;
    if (message.referenceId) {
      let found = false;
      for (let i = 0; i < array.length; i++) {
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
    } else {
      toIndex = array.length;
      array.push(record);
    }
    const mutationInfo: MutationInfo = {
      message: message,
      undoValue: record,
      undoReferenceId: originalBeforeId
    };
    this.host.spliceRecord(message.path, fromIndex, 1);
    this.host.spliceRecord(message.path, toIndex, 0, this.copy(record));
    return mutationInfo;
  }

  private undoArrayMove(item: MutationInfo): void {
    const array = this.getStateElement(this.state, item.message.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: undoArrayMove: problem with array path');
      return null;
    }
    let record: HasId;
    let fromIndex: number;
    let originalBeforeId: string;
    for (let i = 0; i < array.length; i++) {
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
    let toIndex: number;
    let newBeforeId: string;
    if (item.undoReferenceId) {
      let found = false;
      for (let i = 0; i < array.length; i++) {
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
    } else {
      toIndex = array.length;
      array.push(record);
    }
    this.host.spliceRecord(item.message.path, fromIndex, 1);
    this.host.spliceRecord(item.message.path, toIndex, 0, this.copy(record));
  }

  private doArrayElementUpdate(message: MutationMessage): MutationInfo {
    const array = this.getStateElement(this.state, message.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: doArrayElementUpdate: problem with array path');
      return null;
    }
    let record: HasId;
    let index: number;
    for (let i = 0; i < array.length; i++) {
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
    const previousValue = this.getStateElement(record, message.elementPath);
    const mutationInfo: MutationInfo = {
      message: message,
      undoValue: previousValue,
      undoReferenceId: null
    };
    this.setStateElement(record, message.elementPath, message.value);
    this.host.updateRecord(message.path, record.id, index, record, message.elementPath, message.value);
    return mutationInfo;
  }

  private undoArrayElementUpdate(item: MutationInfo): void {
    const array = this.getStateElement(this.state, item.message.path, true) as HasId[];
    if (!array) {
      console.error('MutationStateController: undoArrayElementUpdate: problem with array path');
      return null;
    }
    let record: HasId;
    let index: number;
    for (let i = 0; i < array.length; i++) {
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
  }

  private getStateElement(state: any, path: string, isArray = false): any {
    let object = state;
    const parts = path.split('.');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (typeof object === 'object') {
        if (!object[part]) {
          object[part] = {};
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
}

export interface HostComponent {
  setProperty(path: string, value: any): void;
  spliceRecord(path: string, index: number, removeCount: number, recordToInsert?: any): void;
  updateRecord(path: string, recordId: string, index: number, updatedRecordValue: any, elementPath: string, elementValue: any): void;
}

export interface MutationChannel {
  sendMutation(mutationType: string, path: string, value: any, recordId?: string, referenceId?: string, internalPath?: string): MutationMessage;
}

export interface MutationMessage {
  timestamp: number;
  senderCode: number;
  mutationType: string;
  path: string;
  value: any;
  recordId?: string;
  referenceId?: string;
  elementPath?: string;
}

interface MutationInfo {
  message: MutationMessage;
  undoValue: any;
  undoReferenceId: string;
}

export interface HasId {
  id: string;
}
