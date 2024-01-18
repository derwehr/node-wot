/// <reference types="node" />
/// <reference types="node" />
import ModbusRTU from "modbus-serial";
import { ReadCoilResult, ReadRegisterResult } from "modbus-serial/ModbusRTU";
import { ModbusEntity, ModbusFunction, ModbusForm } from "./modbus";
import { Content, Endianness } from "@node-wot/core";
declare class ModbusTransaction {
    connection: ModbusConnection;
    unitId: number;
    registerType: ModbusEntity;
    function: ModbusFunction;
    base: number;
    quantity: number;
    content?: Buffer;
    operations: Array<PropertyOperation>;
    endianness: Endianness;
    constructor(connection: ModbusConnection, unitId: number, registerType: ModbusEntity, func: ModbusFunction, base: number, quantity: number, endianness: Endianness, content?: Buffer);
    inform(op: PropertyOperation): void;
    trigger(): void;
    execute(): Promise<void>;
}
export declare type ModbusFormWithDefaults = ModbusForm & Required<Pick<ModbusForm, "modbus:function" | "modbus:entity" | "modbus:unitID" | "modbus:address" | "modbus:quantity" | "modbus:timeout" | "modbus:pollingTime">>;
export declare class ModbusConnection {
    host: string;
    port: number;
    client: ModbusRTU;
    connecting: boolean;
    connected: boolean;
    timer: NodeJS.Timer | null;
    currentTransaction: ModbusTransaction | null;
    queue: Array<ModbusTransaction>;
    config: {
        connectionTimeout: number;
        operationTimeout: number;
        connectionRetryTime: number;
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
    trigger(): Promise<void>;
    close(): void;
    readModbus(transaction: ModbusTransaction): Promise<ReadCoilResult | ReadRegisterResult>;
    writeModbus(transaction: ModbusTransaction): Promise<void>;
    private modbusstop;
}
export declare class PropertyOperation {
    unitId: number;
    registerType: ModbusEntity;
    base: number;
    quantity: number;
    function: ModbusFunction;
    content?: Buffer;
    endianness: Endianness;
    transaction: ModbusTransaction | null;
    contentType: string;
    resolve?: (value?: Content | PromiseLike<Content>) => void;
    reject?: (reason?: Error) => void;
    constructor(form: ModbusFormWithDefaults, endianness: Endianness, content?: Buffer);
    execute(): Promise<(Content | PromiseLike<Content>) | undefined>;
    done(base?: number, buffer?: Buffer): void;
    failed(reason: Error): void;
}
export {};
