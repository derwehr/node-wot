import { ModbusForm } from "./modbus";
import { ProtocolClient, Content } from "@node-wot/core";
import { SecurityScheme } from "@node-wot/td-tools";
import { Subscription } from "rxjs/Subscription";
export default class ModbusClient implements ProtocolClient {
    private _connections;
    private _subscriptions;
    constructor();
    readResource(form: ModbusForm): Promise<Content>;
    writeResource(form: ModbusForm, content: Content): Promise<void>;
    invokeResource(form: ModbusForm, content: Content): Promise<Content>;
    unlinkResource(form: ModbusForm): Promise<void>;
    subscribeResource(form: ModbusForm, next: (value: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity(metadata: SecurityScheme[], credentials?: unknown): boolean;
    private performOperation;
    private validateEndianness;
    private overrideFormFromURLPath;
    private validateBufferLength;
    private validateAndFillDefaultForm;
}
