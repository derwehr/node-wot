import { ProtocolClient, Content } from "@node-wot/core";
import * as TD from "@node-wot/td-tools";
import { MqttClientConfig, MqttForm } from "./mqtt";
import { Subscription } from "rxjs/Subscription";
declare interface MqttClientSecurityParameters {
    username: string;
    password: string;
}
export default class MqttClient implements ProtocolClient {
    private config;
    private scheme;
    private pools;
    constructor(config?: MqttClientConfig, secure?: boolean);
    private client?;
    subscribeResource(form: MqttForm, next: (value: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    readResource(form: MqttForm): Promise<Content>;
    writeResource(form: MqttForm, content: Content): Promise<void>;
    invokeResource(form: MqttForm, content: Content): Promise<Content>;
    unlinkResource(form: TD.Form): Promise<void>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity(metadata: Array<TD.SecurityScheme>, credentials?: MqttClientSecurityParameters): boolean;
}
export {};
