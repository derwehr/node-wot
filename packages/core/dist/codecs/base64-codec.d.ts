/// <reference types="node" />
import { ContentCodec } from "../content-serdes";
import { DataSchema } from "wot-typescript-definitions";
export default class Base64Codec implements ContentCodec {
    private subMediaType;
    constructor(subMediaType: string);
    getMediaType(): string;
    bytesToValue(bytes: Buffer, schema?: DataSchema, parameters?: {
        [key: string]: string;
    }): string;
    valueToBytes(value: unknown, schema?: DataSchema, parameters?: {
        [key: string]: string;
    }): Buffer;
}