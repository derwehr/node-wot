/// <reference types="node" />
import { ContentCodec } from "../content-serdes";
import { DataSchema, DataSchemaValue } from "wot-typescript-definitions";
export default class NetconfCodec implements ContentCodec {
    getMediaType(): string;
    bytesToValue(bytes: Buffer, schema?: DataSchema, parameters?: {
        [key: string]: string;
    }): DataSchemaValue;
    valueToBytes(value: unknown, schema?: DataSchema, parameters?: {
        [key: string]: string;
    }): Buffer;
    private getPayloadNamespaces;
}
