import * as TD from "@node-wot/td-tools";
import { Subscription } from "rxjs/Subscription";
import { ProtocolClient, Content } from "@node-wot/core";
import { CoapForm } from "./coap";
declare interface pskSecurityParameters {
    [identity: string]: string;
}
export default class CoapsClient implements ProtocolClient {
    private authorization?;
    toString(): string;
    readResource(form: CoapForm): Promise<Content>;
    writeResource(form: CoapForm, content: Content): Promise<void>;
    invokeResource(form: CoapForm, content?: Content): Promise<Content>;
    unlinkResource(form: CoapForm): Promise<void>;
    subscribeResource(form: CoapForm, next: (value: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity(metadata: Array<TD.SecurityScheme>, credentials?: pskSecurityParameters): boolean;
    private determineRequestMethod;
    private generateRequest;
}
export {};
