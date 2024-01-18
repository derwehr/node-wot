/// <reference types="node" />
import { ContentCodec } from "@node-wot/core";
import { DataSchema } from "@node-wot/td-tools";
import { DataValue } from "node-opcua-data-value";
import "ajv-formats";
import { DataValueJSON } from "node-opcua-json";
import { DataSchemaValue } from "wot-typescript-definitions";
export declare const schemaDataValue: {
    type: string[];
    properties: {
        serverPicoseconds: {
            type: string;
        };
        sourcePicoseconds: {
            type: string;
        };
        serverTimestamp: {
            type: string;
            nullable: boolean;
        };
        sourceTimestamp: {
            type: string;
            nullable: boolean;
        };
        statusCode: {
            type: string[];
            properties: {
                value: {
                    type: string;
                };
            };
        };
        value: {
            type: string[];
            properties: {
                dataType: {
                    type: string[];
                };
                arrayType: {
                    type: string[];
                };
                value: {
                    type: string[];
                };
                dimension: {
                    type: string[];
                    items: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            };
        };
    };
    additionalProperties: boolean;
};
export declare const schemaVariantJSONNull: {
    type: string;
    nullable: boolean;
};
export declare const schemaVariantJSON: {
    type: string;
    properties: {
        Type: {
            type: string[];
        };
        Body: {
            type: string[];
            nullable: boolean;
        };
        Dimensions: {
            type: string[];
            items: {
                type: string;
            };
        };
    };
    additionalProperties: boolean;
    required: string[];
};
export declare const schemaDataValueJSON1: {
    type: string[];
    properties: {
        ServerPicoseconds: {
            type: string;
        };
        SourcePicoseconds: {
            type: string;
        };
        ServerTimestamp: {
            type: string;
        };
        SourceTimestamp: {
            type: string;
        };
        StatusCode: {
            type: string;
            minimum: number;
        };
        Value: {
            type: string;
            properties: {
                Type: {
                    type: string[];
                };
                Body: {
                    type: string[];
                    nullable: boolean;
                };
                Dimensions: {
                    type: string[];
                    items: {
                        type: string;
                    };
                };
            };
            additionalProperties: boolean;
            required: string[];
        };
        Value1: {
            type: string;
            nullable: boolean;
        };
        Value2: {
            oneOf: ({
                type: string;
                nullable: boolean;
            } | {
                type: string;
                properties: {
                    Type: {
                        type: string[];
                    };
                    Body: {
                        type: string[];
                        nullable: boolean;
                    };
                    Dimensions: {
                        type: string[];
                        items: {
                            type: string;
                        };
                    };
                };
                additionalProperties: boolean;
                required: string[];
            })[];
        };
    };
    additionalProperties: boolean;
    required: string[];
};
export declare const schemaDataValueJSON2: {
    properties: {
        Value: {
            type: string;
        };
    };
};
export declare const schemaDataValueJSON: {
    oneOf: {
        properties: {
            Value: {
                type: string;
            };
        };
    }[];
};
export declare const schemaDataValueJSONValidate: import("ajv").ValidateFunction<unknown>;
export declare const schemaDataValueValidate: import("ajv").ValidateFunction<unknown>;
export declare function formatForNodeWoT(dataValue: DataValueJSON): DataValueJSON;
export declare class OpcuaJSONCodec implements ContentCodec {
    getMediaType(): string;
    bytesToValue(bytes: Buffer, schema: DataSchema, parameters?: {
        [key: string]: string;
    }): DataSchemaValue;
    valueToBytes(value: unknown, _schema: DataSchema, parameters?: {
        [key: string]: string;
    }): Buffer;
}
export declare const theOpcuaJSONCodec: OpcuaJSONCodec;
export declare class OpcuaBinaryCodec implements ContentCodec {
    getMediaType(): string;
    bytesToValue(bytes: Buffer, schema: DataSchema, parameters?: {
        [key: string]: string;
    }): DataValueJSON;
    valueToBytes(dataValue: DataValueJSON | DataValue, schema: DataSchema, parameters?: {
        [key: string]: string;
    }): Buffer;
}
export declare const theOpcuaBinaryCodec: OpcuaBinaryCodec;
