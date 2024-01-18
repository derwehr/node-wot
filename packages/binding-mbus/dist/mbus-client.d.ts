import { MBusForm } from "./mbus";
import { ProtocolClient, Content } from "@node-wot/core";
import { SecurityScheme } from "@node-wot/td-tools";
import { Subscription } from "rxjs/Subscription";
export default class MBusClient implements ProtocolClient {
    private _connections;
    constructor();
    readResource(form: MBusForm): Promise<Content>;
    writeResource(form: MBusForm, content: Content): Promise<void>;
    invokeResource(form: MBusForm, content: Content): Promise<Content>;
    unlinkResource(form: MBusForm): Promise<void>;
    subscribeResource(form: MBusForm, next: (value: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity(metadata: SecurityScheme[], credentials?: never): boolean;
    private performOperation;
    private overrideFormFromURLPath;
    private validateAndFillDefaultForm;
}
