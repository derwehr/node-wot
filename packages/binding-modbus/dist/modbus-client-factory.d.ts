import { ProtocolClientFactory, ProtocolClient } from "@node-wot/core";
export default class ModbusClientFactory implements ProtocolClientFactory {
    readonly scheme: string;
    private singleton?;
    getClient(): ProtocolClient;
    init(): boolean;
    destroy(): boolean;
}
