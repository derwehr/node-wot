import { DataSchemaValue } from "wot-typescript-definitions";
export declare class NotReadableError extends Error {
    constructor(message: string);
}
export declare class NotSupportedError extends Error {
    constructor(message: string);
}
export declare class DataSchemaError extends Error {
    value: DataSchemaValue;
    constructor(message: string, value: DataSchemaValue);
}