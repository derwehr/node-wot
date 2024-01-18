import { ProtocolClient, Content } from "@node-wot/core";
import { NetconfForm, NetConfCredentials } from "./netconf";
import * as TD from "@node-wot/td-tools";
import { Subscription } from "rxjs/Subscription";
export default class NetconfClient implements ProtocolClient {
    private client;
    private credentials;
    constructor();
    toString(): string;
    private methodFromForm;
    readResource(form: NetconfForm): Promise<Content>;
    writeResource(form: NetconfForm, content: Content): Promise<void>;
    invokeResource(form: NetconfForm, content: Content): Promise<Content>;
    unlinkResource(form: NetconfForm): Promise<void>;
    subscribeResource(form: NetconfForm, next: (content: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity(metadata: Array<TD.SecurityScheme>, credentials?: NetConfCredentials): boolean;
}
