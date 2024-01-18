import { ProtocolClient, Content } from "@node-wot/core";
import { Form, SecurityScheme } from "@node-wot/td-tools";
import { Subscription } from "rxjs/Subscription";
export default class WebSocketClient implements ProtocolClient {
    constructor();
    toString(): string;
    readResource(form: Form): Promise<Content>;
    writeResource(form: Form, content: Content): Promise<void>;
    invokeResource(form: Form, content?: Content): Promise<Content>;
    unlinkResource(form: Form): Promise<void>;
    subscribeResource(form: Form, next: (content: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity(metadata: Array<SecurityScheme>, credentials?: unknown): boolean;
}
