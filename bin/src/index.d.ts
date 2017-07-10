export declare class DistributedStateController {
    private host;
    private state;
    private history;
    initialize(host: HostComponent, initialState?: any): void;
    updateProperty(path: string, value: any): Promise<void>;
    incrementProperty(path: string, amount: number): Promise<void>;
    arrayInsert(path: string, value: any, beforeId?: string): Promise<void>;
    arrayRemove(path: string, id: string): Promise<void>;
    arrayMove(path: string, id: string, beforeId: string): Promise<void>;
    arrayElementUpdate(path: string, id: string, internalPath: string, value: any): Promise<void>;
    updateText(path: string, updatedValue: string): Promise<void>;
    handleInboundMutation(mutation: Mutation, messageInfo: CardToCardMessage): Promise<void>;
    private integrateMutation(mutation);
    private applyMutation(mutation);
    private undoMutation(item);
    private doPropertyUpdate(item);
    private undoPropertyUpdate(undoable);
    private doPropertyIncrement(item);
    private undoPropertyIncrement(undoable);
    private doArrayInsert(item);
    private undoArrayInsert(undoable);
    private doArrayRemove(item);
    private undoArrayRemove(undoable);
    private doArrayMove(item);
    private undoArrayMove(undoable);
    private doArrayElementUpdate(item);
    private undoArrayElementUpdate(undoable);
    private doTextUpdate(item);
    private undoTextUpdate(undoable);
    private getCaretUpdater(patches);
    private getStateElement(state, path, isArray?);
    private setStateElement(state, path, value);
    private copy(object);
    private sendMutation(mutationType, path, value?, recordId?, referenceId?, elementPath?);
}
export interface HostComponent {
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
export interface HasId {
    id: string;
}
