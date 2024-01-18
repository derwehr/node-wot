import { ProtocolClientFactory, ProtocolClient, ContentSerdes } from "@node-wot/core";
export declare class OPCUAClientFactory implements ProtocolClientFactory {
    readonly scheme: string;
    private _clients;
    contentSerdes: ContentSerdes;
    constructor();
    getClient(): ProtocolClient;
    init(): boolean;
    destroy(): boolean;
}
