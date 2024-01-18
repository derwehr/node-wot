import { ProtocolClientFactory, ProtocolClient } from "@node-wot/core";
export default class WssClientFactory implements ProtocolClientFactory {
    readonly scheme: string;
    constructor();
    getClient(): ProtocolClient;
    init(): boolean;
    destroy(): boolean;
}
