import { Form, SecurityScheme } from "@node-wot/td-tools";
import { ProtocolClient, Content } from "@node-wot/core";
import { Subscription } from "rxjs/Subscription";
export default class FileClient implements ProtocolClient {
    toString(): string;
    private readFromFile;
    readResource(form: Form): Promise<Content>;
    writeResource(form: Form, content: Content): Promise<void>;
    invokeResource(form: Form, content: Content): Promise<Content>;
    unlinkResource(form: Form): Promise<void>;
    requestThingDescription(uri: string): Promise<Content>;
    subscribeResource(form: Form, next: (value: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity: (metadata: Array<SecurityScheme>) => boolean;
}
