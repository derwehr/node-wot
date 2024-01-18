/// <reference types="node" />
import * as TD from "@node-wot/td-tools";
import { DataSchemaValue } from "wot-typescript-definitions";
export default class NetconfCodec {
    getMediaType(): string;
    bytesToValue(bytes: Buffer, schema: TD.DataSchema, parameters: {
        [key: string]: string;
    }): DataSchemaValue;
    valueToBytes(value: unknown, schema: TD.DataSchema, parameters?: {
        [key: string]: string;
    }): Buffer;
    private getPayloadNamespaces;
}
