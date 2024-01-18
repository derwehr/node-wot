/// <reference types="node" />
import { ContentCodec } from "../content-serdes";
import { DataSchema, DataSchemaValue } from "wot-typescript-definitions";
export default class CborCodec implements ContentCodec {
    private subMediaType;
    constructor(subMediaType?: string);
    getMediaType(): string;
    bytesToValue(bytes: Buffer, schema?: DataSchema, parameters?: {
        [key: string]: string;
    }): DataSchemaValue;
    valueToBytes(value: unknown, schema?: DataSchema, parameters?: {
        [key: string]: string;
    }): Buffer;
}
