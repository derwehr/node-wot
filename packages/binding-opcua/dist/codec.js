"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.theOpcuaBinaryCodec = exports.OpcuaBinaryCodec = exports.theOpcuaJSONCodec = exports.OpcuaJSONCodec = exports.formatForNodeWoT = exports.schemaDataValueValidate = exports.schemaDataValueJSONValidate = exports.schemaDataValueJSON = exports.schemaDataValueJSON2 = exports.schemaDataValueJSON1 = exports.schemaVariantJSON = exports.schemaVariantJSONNull = exports.schemaDataValue = void 0;
const core_1 = require("@node-wot/core");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_variant_1 = require("node-opcua-variant");
const ajv_1 = __importDefault(require("ajv"));
require("ajv-formats");
const node_opcua_json_1 = require("node-opcua-json");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const { debug } = (0, core_1.createLoggers)("binding-opcua", "codec");
const ajv = new ajv_1.default({ strict: false });
exports.schemaDataValue = {
    type: ["object"],
    properties: {
        serverPicoseconds: { type: "integer" },
        sourcePicoseconds: { type: "integer" },
        serverTimestamp: { type: "string", nullable: true },
        sourceTimestamp: { type: "string", nullable: true },
        statusCode: {
            type: ["object"],
            properties: {
                value: {
                    type: "number",
                },
            },
        },
        value: {
            type: ["object"],
            properties: {
                dataType: {
                    type: ["string", "integer"],
                },
                arrayType: {
                    type: ["string"],
                },
                value: {
                    type: ["number", "integer", "string", "boolean", "array", "null", "object"],
                },
                dimension: {
                    type: ["array"],
                    items: { type: "integer" },
                },
                additionalProperties: false,
            },
        },
    },
    additionalProperties: true,
};
exports.schemaVariantJSONNull = {
    type: "null",
    nullable: true,
};
exports.schemaVariantJSON = {
    type: "object",
    properties: {
        Type: {
            type: ["number"],
        },
        Body: {
            type: ["number", "integer", "string", "boolean", "array", "null", "object"],
            nullable: true,
        },
        Dimensions: {
            type: ["array"],
            items: { type: "integer" },
        },
    },
    additionalProperties: false,
    required: ["Type", "Body"],
};
exports.schemaDataValueJSON1 = {
    type: ["object"],
    properties: {
        ServerPicoseconds: { type: "integer" },
        SourcePicoseconds: { type: "integer" },
        ServerTimestamp: {
            type: "string",
        },
        SourceTimestamp: {
            type: "string",
        },
        StatusCode: {
            type: "integer",
            minimum: 0,
        },
        Value: exports.schemaVariantJSON,
        Value1: { type: "number", nullable: true },
        Value2: {
            oneOf: [exports.schemaVariantJSON, exports.schemaVariantJSONNull],
        },
    },
    additionalProperties: false,
    required: ["Value"],
};
exports.schemaDataValueJSON2 = {
    properties: {
        Value: { type: "null" },
    },
};
exports.schemaDataValueJSON = {
    oneOf: [exports.schemaDataValueJSON2, exports.schemaDataValueJSON1],
};
exports.schemaDataValueJSONValidate = ajv.compile(exports.schemaDataValueJSON);
exports.schemaDataValueValidate = ajv.compile(exports.schemaDataValue);
function formatForNodeWoT(dataValue) {
    delete dataValue.SourcePicoseconds;
    delete dataValue.ServerPicoseconds;
    delete dataValue.ServerTimestamp;
    return dataValue;
}
exports.formatForNodeWoT = formatForNodeWoT;
class OpcuaJSONCodec {
    getMediaType() {
        return "application/opcua+json";
    }
    bytesToValue(bytes, schema, parameters) {
        var _a;
        const type = (_a = parameters === null || parameters === void 0 ? void 0 : parameters.type) !== null && _a !== void 0 ? _a : "DataValue";
        let parsed = JSON.parse(bytes.toString());
        const wantDataValue = (parameters === null || parameters === void 0 ? void 0 : parameters.to) === "DataValue" || false;
        switch (type) {
            case "DataValue": {
                const isValid = (0, exports.schemaDataValueJSONValidate)(parsed);
                if (!isValid) {
                    debug(`bytesToValue: parsed = ${parsed}`);
                    debug(`bytesToValue: ${exports.schemaDataValueJSONValidate.errors}`);
                    throw new Error("Invalid JSON dataValue : " + JSON.stringify(parsed, null, " "));
                }
                if (wantDataValue) {
                    return (0, node_opcua_json_1.opcuaJsonDecodeDataValue)(parsed);
                }
                return formatForNodeWoT((0, node_opcua_json_1.opcuaJsonEncodeDataValue)((0, node_opcua_json_1.opcuaJsonDecodeDataValue)(parsed), true));
            }
            case "Variant": {
                if (wantDataValue) {
                    const dataValue = new node_opcua_data_value_1.DataValue({ value: (0, node_opcua_json_1.opcuaJsonDecodeVariant)(parsed) });
                    return dataValue;
                }
                const v = (0, node_opcua_json_1.opcuaJsonEncodeVariant)((0, node_opcua_json_1.opcuaJsonDecodeVariant)(parsed), true);
                debug(`${v}`);
                return v;
            }
            case "Value": {
                if (wantDataValue) {
                    if (!parameters || !parameters.dataType) {
                        throw new Error("[OpcuaJSONCodec|bytesToValue]: unknown dataType for Value encoding" + type);
                    }
                    if (parameters.dataType === node_opcua_variant_1.DataType[node_opcua_variant_1.DataType.DateTime]) {
                        parsed = new Date(parsed);
                    }
                    const value = {
                        dataType: node_opcua_variant_1.DataType[parameters.dataType],
                        value: parsed,
                    };
                    return new node_opcua_data_value_1.DataValue({ value });
                }
                else {
                    if ((parameters === null || parameters === void 0 ? void 0 : parameters.dataType) === node_opcua_variant_1.DataType[node_opcua_variant_1.DataType.DateTime]) {
                        parsed = new Date(parsed);
                    }
                    return parsed;
                }
            }
            default:
                throw new Error("[OpcuaJSONCodec|bytesToValue]: Invalid type " + type);
        }
    }
    valueToBytes(value, _schema, parameters) {
        var _a;
        const type = (_a = parameters === null || parameters === void 0 ? void 0 : parameters.type) !== null && _a !== void 0 ? _a : "DataValue";
        switch (type) {
            case "DataValue": {
                let dataValueJSON;
                if (value instanceof node_opcua_data_value_1.DataValue) {
                    dataValueJSON = (0, node_opcua_json_1.opcuaJsonEncodeDataValue)(value, true);
                }
                else if (value instanceof node_opcua_variant_1.Variant) {
                    dataValueJSON = (0, node_opcua_json_1.opcuaJsonEncodeDataValue)(new node_opcua_data_value_1.DataValue({ value }), true);
                }
                else if (typeof value === "string") {
                    dataValueJSON = JSON.parse(value);
                }
                else {
                    dataValueJSON = (0, node_opcua_json_1.opcuaJsonEncodeDataValue)((0, node_opcua_json_1.opcuaJsonDecodeDataValue)(value), true);
                }
                dataValueJSON = formatForNodeWoT(dataValueJSON);
                return Buffer.from(JSON.stringify(dataValueJSON), "ascii");
            }
            case "Variant": {
                if (value instanceof node_opcua_data_value_1.DataValue) {
                    value = (0, node_opcua_json_1.opcuaJsonEncodeVariant)(value.value, true);
                }
                else if (value instanceof node_opcua_variant_1.Variant) {
                    value = (0, node_opcua_json_1.opcuaJsonEncodeVariant)(value, true);
                }
                else if (typeof value === "string") {
                    value = JSON.parse(value);
                }
                return Buffer.from(JSON.stringify(value), "ascii");
            }
            case "Value": {
                if (value === undefined) {
                    return Buffer.alloc(0);
                }
                if (value instanceof node_opcua_data_value_1.DataValue) {
                    value = (0, node_opcua_json_1.opcuaJsonEncodeVariant)(value.value, false);
                }
                else if (value instanceof node_opcua_variant_1.Variant) {
                    value = (0, node_opcua_json_1.opcuaJsonEncodeVariant)(value, false);
                }
                return Buffer.from(JSON.stringify(value), "ascii");
            }
            default:
                throw new Error("[OpcuaJSONCodec|valueToBytes]: Invalid type : " + type);
        }
    }
}
exports.OpcuaJSONCodec = OpcuaJSONCodec;
exports.theOpcuaJSONCodec = new OpcuaJSONCodec();
class OpcuaBinaryCodec {
    getMediaType() {
        return "application/opcua+octet-stream";
    }
    bytesToValue(bytes, schema, parameters) {
        const binaryStream = new node_opcua_binary_stream_1.BinaryStream(bytes);
        const dataValue = new node_opcua_data_value_1.DataValue();
        dataValue.decode(binaryStream);
        return (0, node_opcua_json_1.opcuaJsonEncodeDataValue)(dataValue, true);
    }
    valueToBytes(dataValue, schema, parameters) {
        dataValue = dataValue instanceof node_opcua_data_value_1.DataValue ? dataValue : (0, node_opcua_json_1.opcuaJsonDecodeDataValue)(dataValue);
        dataValue.serverPicoseconds = 0;
        dataValue.sourcePicoseconds = 0;
        dataValue.serverTimestamp = null;
        const size = dataValue.binaryStoreSize();
        const stream = new node_opcua_binary_stream_1.BinaryStream(size);
        dataValue.encode(stream);
        const body = stream.buffer;
        return body;
    }
}
exports.OpcuaBinaryCodec = OpcuaBinaryCodec;
exports.theOpcuaBinaryCodec = new OpcuaBinaryCodec();
//# sourceMappingURL=codec.js.map