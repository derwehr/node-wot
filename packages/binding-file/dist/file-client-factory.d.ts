import { ProtocolClientFactory, ProtocolClient } from "@node-wot/core";
export default class FileClientFactory implements ProtocolClientFactory {
    readonly scheme: string;
    getClient(): ProtocolClient;
    init: () => boolean;
    destroy: () => boolean;
}
