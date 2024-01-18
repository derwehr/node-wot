import { ProtocolClientFactory, ProtocolClient, ContentSerdes } from "@node-wot/core";
export default class NetconfClientFactory implements ProtocolClientFactory {
    readonly scheme: string;
    contentSerdes: ContentSerdes;
    getClient(): ProtocolClient;
    init: () => boolean;
    destroy: () => boolean;
}
