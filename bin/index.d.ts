export declare class MutationStateController {
    private host;
    private channel;
    private state;
    private history;
    constructor(host: HostComponent, channel: MutationChannel, initialState?: any);
    updateProperty(path: string, value: any): Promise<void>;
    arrayInsert(path: string, value: HasId, beforeId?: string): Promise<void>;
    arrayRemove(path: string, id: string): Promise<void>;
    arrayMove(path: string, id: string, beforeId: string): Promise<void>;
    arrayElementUpdate(path: string, id: string, internalPath: string, value: any): Promise<void>;
    handleInboundMutation(message: MutationMessage): Promise<void>;
    private integrateMutation(message);
    private applyMutation(message);
    private undoMutation(item);
    private doPropertyUpdate(message);
    private undoPropertyUpdate(item);
    private doArrayInsert(message);
    private undoArrayInsert(item);
    private doArrayRemove(message);
    private undoArrayRemove(item);
    private doArrayMove(message);
    private undoArrayMove(item);
    private doArrayElementUpdate(message);
    private undoArrayElementUpdate(item);
    private getStateElement(state, path, isArray?);
    private setStateElement(state, path, value);
    private copy(object);
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
export interface HasId {
    id: string;
}
