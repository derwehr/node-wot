import { Subscription } from "rxjs/Subscription";
import * as TD from "@node-wot/td-tools";
import { ProtocolClient, Content } from "@node-wot/core";
import { CoapForm } from "./coap";
import CoapServer from "./coap-server";
export default class CoapClient implements ProtocolClient {
    private agent;
    private readonly agentOptions;
    constructor(server?: CoapServer);
    toString(): string;
    readResource(form: CoapForm): Promise<Content>;
    writeResource(form: CoapForm, content: Content): Promise<void>;
    invokeResource(form: CoapForm, content?: Content): Promise<Content>;
    unlinkResource(form: CoapForm): Promise<void>;
    subscribeResource(form: CoapForm, next: (value: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity: (metadata: Array<TD.SecurityScheme>) => boolean;
    private uriToOptions;
    private setBlockOption;
    private getRequestParamsFromForm;
    private applyFormDataToRequest;
    private generateRequest;
}
