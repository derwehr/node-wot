/// <reference types="node" />
import { MBusForm } from "./mbus";
import { Content } from "@node-wot/core";
declare class MBusTransaction {
    unitId: number;
    base: number;
    operations: Array<PropertyOperation>;
    constructor(unitId: number, base: number);
    inform(op: PropertyOperation): void;
}
export declare class MBusConnection {
    host: string;
    port: number;
    client: any;
    connecting: boolean;
    connected: boolean;
    timer?: NodeJS.Timer;
    currentTransaction?: MBusTransaction;
    queue: Array<MBusTransaction>;
    config: {
        connectionTimeout?: number;
        operationTimeout?: number;
        connectionRetryTime?: number;
        maxRetries: number;
    };
    constructor(host: string, port: number, config?: {
        connectionTimeout?: number;
        operationTimeout?: number;
        connectionRetryTime?: number;
        maxRetries?: number;
    });
    enqueue(op: PropertyOperation): void;
    connect(): Promise<void>;
    execute(op: PropertyOperation): Promise<Content | PromiseLike<Content> | undefined>;
    trigger(): Promise<void>;
    executeTransaction(transaction: MBusTransaction): Promise<void>;
    close(): void;
    readMBus(transaction: MBusTransaction): Promise<unknown>;
    private mbusstop;
}
export declare class PropertyOperation {
    unitId: number;
    base: number;
    resolve?: (value?: Content | PromiseLike<Content>) => void;
    reject?: (reason?: Error) => void;
    constructor(form: MBusForm);
    execute(): Promise<(Content | PromiseLike<Content>) | undefined>;
    done(base?: number, result?: any): void;
    failed(reason: Error): void;
}
export {};
