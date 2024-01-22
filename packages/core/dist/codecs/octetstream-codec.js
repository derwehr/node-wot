"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const float16_1 = require("@petamoriken/float16");
const logger_1 = require("../logger");
const protocol_interfaces_1 = require("../protocol-interfaces");
const { debug, warn } = (0, logger_1.createLoggers)("core", "octetstream-codec");
class OctetstreamCodec {
    getMediaType() {
        return "application/octet-stream";
    }
    bytesToValue(bytes, schema, parameters = {}) {
        var _a, _b, _c, _d;
        debug("OctetstreamCodec parsing", bytes);
        debug("Parameters", parameters);
        const bigEndian = !(((_a = parameters.byteSeq) === null || _a === void 0 ? void 0 : _a.includes(protocol_interfaces_1.Endianness.LITTLE_ENDIAN)) === true);
        let signed = parameters.signed !== "false";
        signed = (_b = schema === null || schema === void 0 ? void 0 : schema.signed) !== null && _b !== void 0 ? _b : signed;
        const offset = (schema === null || schema === void 0 ? void 0 : schema["ex:bitOffset"]) !== undefined ? parseInt(schema["ex:bitOffset"]) : 0;
        if (parameters.length != null && parseInt(parameters.length) !== bytes.length) {
            throw new Error("Lengths do not match, required: " + parameters.length + " provided: " + bytes.length);
        }
        let bitLength = (schema === null || schema === void 0 ? void 0 : schema["ex:bitLength"]) !== undefined ? parseInt(schema["ex:bitLength"]) : bytes.length * 8;
        let dataType = schema === null || schema === void 0 ? void 0 : schema.type;
        if (!dataType) {
            throw new Error("Missing 'type' property in schema");
        }
        if (/(short|(u)?int(8|16|32)?$|float(16|32|64)?|byte)/.test(dataType.toLowerCase())) {
            const typeSem = /(u)?(short|int|float|byte)(8|16|32|64)?/.exec(dataType.toLowerCase());
            if (typeSem) {
                if (typeSem[1] === "u") {
                    if ((parameters === null || parameters === void 0 ? void 0 : parameters.signed) === "true") {
                        throw new Error("Type is unsigned but 'signed' is true");
                    }
                    signed = false;
                }
                dataType = typeSem[2];
                if (parseInt(typeSem[3]) !== bitLength) {
                    throw new Error(`Type is '${((_c = typeSem[1]) !== null && _c !== void 0 ? _c : "") + typeSem[2] + typeSem[3]}' but 'ex:bitLength' is ` + bitLength);
                }
            }
        }
        if (bitLength > bytes.length * 8 - offset) {
            throw new Error(`'ex:bitLength' is ${bitLength}, but buffer length at offset ${offset} is ${bytes.length * 8 - offset}`);
        }
        if (((_d = parameters === null || parameters === void 0 ? void 0 : parameters.byteSeq) === null || _d === void 0 ? void 0 : _d.includes("BYTE_SWAP")) === true && bytes.length > 1) {
            bytes.swap16();
        }
        if (offset !== undefined && bitLength < bytes.length * 8) {
            bytes = this.readBits(bytes, offset, bitLength);
            bitLength = bytes.length * 8;
        }
        switch (dataType) {
            case "boolean":
                return !bytes.every((val) => val === 0);
            case "byte":
            case "short":
            case "int":
            case "integer":
                return this.integerToValue(bytes, { dataLength: bitLength, bigEndian, signed });
            case "float":
            case "double":
            case "number":
                if ((schema === null || schema === void 0 ? void 0 : schema.scale) !== undefined) {
                    return this.integerToValue(bytes, { dataLength: bitLength, bigEndian, signed }) * schema.scale;
                }
                return this.numberToValue(bytes, { dataLength: bitLength, bigEndian });
            case "string":
                return bytes.toString(parameters.charset);
            case "object":
                if (schema === undefined || schema.properties === undefined) {
                    throw new Error("Missing schema for object");
                }
                return this.objectToValue(bytes, schema, parameters);
            case "null":
                return null;
            case "array":
            default:
                throw new Error("Unable to handle dataType " + dataType);
        }
    }
    integerToValue(bytes, options) {
        const { dataLength, bigEndian, signed } = options;
        switch (dataLength) {
            case 8:
                return signed ? bytes.readInt8(0) : bytes.readUInt8(0);
            case 16:
                return bigEndian
                    ? signed
                        ? bytes.readInt16BE(0)
                        : bytes.readUInt16BE(0)
                    : signed
                        ? bytes.readInt16LE(0)
                        : bytes.readUInt16LE(0);
            case 32:
                return bigEndian
                    ? signed
                        ? bytes.readInt32BE(0)
                        : bytes.readUInt32BE(0)
                    : signed
                        ? bytes.readInt32LE(0)
                        : bytes.readUInt32LE(0);
            default: {
                const result = bigEndian
                    ? signed
                        ? bytes.readIntBE(0, dataLength / 8)
                        : bytes.readUIntBE(0, dataLength / 8)
                    : signed
                        ? bytes.readIntLE(0, dataLength / 8)
                        : bytes.readUIntLE(0, dataLength / 8);
                if (!Number.isSafeInteger(result)) {
                    warn("Result is not a safe integer");
                }
                return result;
            }
        }
    }
    numberToValue(bytes, options) {
        const { dataLength, bigEndian } = options;
        switch (dataLength) {
            case 16:
                return (0, float16_1.getFloat16)(new DataView(bytes.buffer), bytes.byteOffset, !bigEndian);
            case 32:
                return bigEndian ? bytes.readFloatBE(0) : bytes.readFloatLE(0);
            case 64:
                return bigEndian ? bytes.readDoubleBE(0) : bytes.readDoubleLE(0);
            default:
                throw new Error("Wrong buffer length for type 'number', must be 16, 32, or 64 is " + dataLength);
        }
    }
    objectToValue(bytes, schema, parameters = {}) {
        if ((schema === null || schema === void 0 ? void 0 : schema.type) !== "object") {
            throw new Error("Schema must be of type 'object'");
        }
        const result = {};
        const sortedProperties = Object.getOwnPropertyNames(schema.properties);
        for (const propertyName of sortedProperties) {
            const propertySchema = schema.properties[propertyName];
            if (propertySchema.type === "object") {
                const bitLength = parseInt(propertySchema["ex:bitLength"]);
                const bitOffset = propertySchema["ex:bitOffset"] !== undefined ? parseInt(propertySchema["ex:bitOffset"]) : 0;
                const length = isNaN(bitLength) ? bytes.length : Math.ceil(bitLength / 8);
                const buf = Buffer.alloc(length);
                this.copyBits(bytes, bitOffset, buf, 0, length * 8);
                result[propertyName] = this.objectToValue(buf, propertySchema, Object.assign(Object.assign({}, parameters), { length: length.toString() }));
            }
            else {
                result[propertyName] = this.bytesToValue(bytes, propertySchema, parameters);
            }
        }
        return result;
    }
    valueToBytes(value, schema, parameters = {}) {
        var _a, _b, _c, _d, _e, _f;
        debug(`OctetstreamCodec serializing '${value}'`);
        if (parameters.length == null) {
            warn("Missing 'length' parameter necessary for write. I'll do my best");
        }
        const bigEndian = !(((_a = parameters.byteSeq) === null || _a === void 0 ? void 0 : _a.includes(protocol_interfaces_1.Endianness.LITTLE_ENDIAN)) === true);
        let signed = parameters.signed !== "false";
        let length = parameters.length != null ? parseInt(parameters.length) : undefined;
        let bitLength = (schema === null || schema === void 0 ? void 0 : schema["ex:bitLength"]) !== undefined ? parseInt(schema["ex:bitLength"]) : undefined;
        const offset = (schema === null || schema === void 0 ? void 0 : schema["ex:bitOffset"]) !== undefined ? parseInt(schema["ex:bitOffset"]) : 0;
        let dataType = (_b = schema === null || schema === void 0 ? void 0 : schema.type) !== null && _b !== void 0 ? _b : undefined;
        if (value === undefined) {
            throw new Error("Undefined value");
        }
        if (dataType === undefined) {
            throw new Error("Missing 'type' property in schema");
        }
        if (/(short|(u)?int(8|16|32)?$|float(16|32|64)?|byte)/.test(dataType.toLowerCase())) {
            const typeSem = /(u)?(short|int|float|byte)(8|16|32|64)?/.exec(dataType.toLowerCase());
            if (typeSem) {
                if (typeSem[1] === "u") {
                    if ((parameters === null || parameters === void 0 ? void 0 : parameters.signed) === "true") {
                        throw new Error("Type is unsigned but 'signed' is true");
                    }
                    signed = false;
                }
                dataType = typeSem[2];
                if (bitLength !== undefined) {
                    if (parseInt(typeSem[3]) !== bitLength) {
                        throw new Error(`Type is '${((_c = typeSem[1]) !== null && _c !== void 0 ? _c : "") + typeSem[2] + typeSem[3]}' but 'ex:bitLength' is ` +
                            bitLength);
                    }
                }
                else {
                    bitLength = +typeSem[3];
                }
            }
        }
        if (length === undefined) {
            if (bitLength !== undefined) {
                length = Math.ceil((offset + bitLength) / 8);
            }
            warn("Missing 'length' parameter necessary for write. I'll do my best");
        }
        else {
            if (bitLength === undefined) {
                bitLength = length * 8;
            }
            else {
                if (length * 8 < bitLength + offset) {
                    throw new Error("Length is too short for 'ex:bitLength' and 'ex:bitOffset'");
                }
            }
        }
        switch (dataType) {
            case "boolean":
                if (value === true) {
                    const buf = Buffer.alloc(length !== null && length !== void 0 ? length : 1, 0);
                    for (let i = offset; i < offset + (bitLength !== null && bitLength !== void 0 ? bitLength : buf.length * 8); ++i) {
                        buf[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
                    }
                    return buf;
                }
                else {
                    return Buffer.alloc(length !== null && length !== void 0 ? length : 1, 0);
                }
            case "byte":
            case "short":
            case "int":
            case "integer":
                return this.valueToInteger(value, {
                    bitLength,
                    byteLength: length,
                    bigEndian,
                    offset,
                    signed,
                    byteSeq: (_d = parameters.byteSeq) !== null && _d !== void 0 ? _d : "",
                });
            case "float":
            case "number":
                return this.valueToNumber(value, {
                    bitLength,
                    byteLength: length,
                    bigEndian,
                    offset,
                    byteSeq: (_e = parameters.byteSeq) !== null && _e !== void 0 ? _e : "",
                });
            case "string": {
                return this.valueToString(value, {
                    bitLength,
                    byteLength: length,
                    offset,
                    charset: (_f = parameters.charset) !== null && _f !== void 0 ? _f : "utf8",
                });
            }
            case "object":
                if (schema === undefined || schema.properties === undefined) {
                    throw new Error("Missing schema for object");
                }
                return value === null
                    ? Buffer.alloc(0)
                    : this.valueToObject(value, schema, parameters);
            case "array":
            case "undefined":
                throw new Error("Unable to handle dataType " + dataType);
            case "null":
                return Buffer.alloc(0);
            default:
                throw new Error("Unable to handle dataType " + dataType);
        }
    }
    valueToInteger(value, options) {
        var _a, _b, _c;
        const length = (_a = options.bitLength) !== null && _a !== void 0 ? _a : 32;
        const offset = (_b = options.offset) !== null && _b !== void 0 ? _b : 0;
        const byteLength = (_c = options.byteLength) !== null && _c !== void 0 ? _c : Math.ceil((offset + length) / 8);
        const { bigEndian, signed, byteSeq } = options;
        if (typeof value !== "number") {
            throw new Error("Value is not a number");
        }
        if (!Number.isSafeInteger(value)) {
            warn("Value is not a safe integer", value);
        }
        const limit = Math.pow(2, signed ? length - 1 : length) - 1;
        if (signed) {
            if (value < -limit - 1 || value > limit) {
                throw new Error("Integer overflow when representing signed " + value + " in " + length + " bit(s)");
            }
        }
        else {
            if (value < 0 || value > limit) {
                throw new Error("Integer overflow when representing unsigned " + value + " in " + length + " bit(s)");
            }
        }
        const buf = Buffer.alloc(byteLength);
        if (offset !== 0) {
            this.writeBits(buf, value, offset, length, bigEndian);
            return buf;
        }
        if ((byteSeq === null || byteSeq === void 0 ? void 0 : byteSeq.includes("BYTE_SwAP")) && byteLength > 1) {
            buf.swap16();
        }
        switch (byteLength) {
            case 1:
                signed ? buf.writeInt8(value, 0) : buf.writeUInt8(value, 0);
                break;
            case 2:
                bigEndian
                    ? signed
                        ? buf.writeInt16BE(value, 0)
                        : buf.writeUInt16BE(value, 0)
                    : signed
                        ? buf.writeInt16LE(value, 0)
                        : buf.writeUInt16LE(value, 0);
                break;
            case 4:
                bigEndian
                    ? signed
                        ? buf.writeInt32BE(value, 0)
                        : buf.writeUInt32BE(value, 0)
                    : signed
                        ? buf.writeInt32LE(value, 0)
                        : buf.writeUInt32LE(value, 0);
                break;
            default:
                if (signed && value < 0) {
                    value += 1 << (8 * length);
                }
                for (let i = 0; i < byteLength; ++i) {
                    const byte = value % 0x100;
                    value /= 0x100;
                    buf.writeInt8(byte, bigEndian ? byteLength - i - 1 : i);
                }
        }
        return buf;
    }
    valueToNumber(value, options) {
        var _a, _b, _c;
        if (typeof value !== "number") {
            throw new Error("Value is not a number");
        }
        const length = (_a = options.bitLength) !== null && _a !== void 0 ? _a : (options.byteLength !== undefined ? options.byteLength * 8 : 32);
        const offset = (_b = options.offset) !== null && _b !== void 0 ? _b : 0;
        const { bigEndian, byteSeq } = options;
        const byteLength = (_c = options.byteLength) !== null && _c !== void 0 ? _c : Math.ceil((offset + length) / 8);
        const byteOffset = Math.floor(offset / 8);
        const buf = Buffer.alloc(byteLength);
        if (offset % 8 !== 0) {
            throw new Error("Offset must be a multiple of 8");
        }
        if (byteSeq && byteLength > 1) {
            buf.swap16();
        }
        switch (length) {
            case 16:
                (0, float16_1.setFloat16)(new DataView(buf.buffer), byteOffset, value, !bigEndian);
                break;
            case 32:
                bigEndian ? buf.writeFloatBE(value, byteOffset) : buf.writeFloatLE(value, 0);
                break;
            case 64:
                bigEndian ? buf.writeDoubleBE(value, byteOffset) : buf.writeDoubleLE(value, 0);
                break;
            default:
                throw new Error("Wrong buffer length for type 'number', must be 16, 32, or 64 is " + length);
        }
        return buf;
    }
    valueToString(value, options) {
        var _a, _b, _c;
        if (typeof value !== "string") {
            throw new Error("Value is not a string");
        }
        const offset = (_a = options.offset) !== null && _a !== void 0 ? _a : 0;
        const { charset } = options;
        const str = String(value);
        if (!Buffer.isEncoding(charset)) {
            throw new Error("Invalid charset " + charset);
        }
        const buf = Buffer.from(str, charset);
        const bitLength = (_b = options.bitLength) !== null && _b !== void 0 ? _b : buf.length * 8;
        if (buf.length > bitLength) {
            throw new Error(`String is ${buf.length * 8} bits long, but 'ex:bitLength' is ${bitLength}`);
        }
        const byteLength = (_c = options.byteLength) !== null && _c !== void 0 ? _c : Math.ceil((offset + bitLength) / 8);
        if (offset % 8 === 0) {
            return Buffer.concat([Buffer.alloc(byteLength - bitLength / 8), buf]);
        }
        else {
            const buffer = Buffer.alloc(byteLength);
            this.copyBits(buf, 0, buffer, offset, bitLength);
            return buffer;
        }
    }
    valueToObject(value, schema, parameters = {}, result) {
        if (typeof value !== "object" || value === null) {
            throw new Error("Value is not an object");
        }
        if (parameters.length === undefined) {
            throw new Error("Missing 'length' parameter necessary for write");
        }
        result = result !== null && result !== void 0 ? result : Buffer.alloc(parseInt(parameters.length));
        for (const propertyName in schema.properties) {
            if (Object.hasOwnProperty.call(value, propertyName) === false) {
                if (schema.properties[propertyName].default !== undefined) {
                    value[propertyName] = schema.properties[propertyName].default;
                }
                else {
                    throw new Error(`Missing property '${propertyName}'`);
                }
            }
            const propertySchema = schema.properties[propertyName];
            const propertyValue = value[propertyName];
            const propertyOffset = parseInt(propertySchema["ex:bitOffset"]);
            const propertyLength = parseInt(propertySchema["ex:bitLength"]);
            let buf;
            if (propertySchema.type === "object") {
                const length = Math.ceil(propertyLength / 8).toString();
                buf = this.valueToObject(propertyValue, propertySchema, Object.assign(Object.assign({}, parameters), { length }), result);
            }
            else {
                buf = this.valueToBytes(propertyValue, propertySchema, parameters);
            }
            this.copyBits(buf, propertyOffset, result, propertyOffset, propertyLength);
        }
        return result;
    }
    readBits(buffer, bitOffset, bitLength) {
        if (bitOffset < 0) {
            throw new Error("bitOffset must be >= 0");
        }
        if (bitLength < 0) {
            throw new Error("bitLength must be >= 0");
        }
        if (bitOffset + bitLength > buffer.length * 8) {
            throw new Error("bitOffset + bitLength must be <= buffer.length * 8");
        }
        const resultBuffer = Buffer.alloc(Math.ceil(bitLength / 8));
        let byteOffset = Math.floor(bitOffset / 8);
        let bitOffsetInByte = bitOffset % 8;
        let targetByte = buffer[byteOffset];
        let result = 0;
        let resultOffset = 0;
        for (let i = 0; i < bitLength; i++) {
            const bit = (targetByte >> (7 - bitOffsetInByte)) & 0x01;
            result = (result << 1) | bit;
            bitOffsetInByte++;
            if (bitOffsetInByte > 7) {
                byteOffset++;
                bitOffsetInByte = 0;
                targetByte = buffer[byteOffset];
            }
            if (i + 1 === bitLength % 8 || (i + 1) % 8 === bitLength % 8 || i === bitLength - 1) {
                resultBuffer[resultOffset] = result;
                result = 0;
                resultOffset++;
            }
        }
        return resultBuffer;
    }
    writeBits(buffer, value, offsetBits, length, bigEndian) {
        let byteIndex = Math.floor(offsetBits / 8);
        let bitIndex = offsetBits % 8;
        for (let i = 0; i < length; i++) {
            const bitValue = bigEndian ? (value >> (length - 1 - i)) & 1 : (value >> i) & 1;
            buffer[byteIndex] |= bitValue << (bigEndian ? 7 - bitIndex : bitIndex);
            bitIndex++;
            if (bitIndex === 8) {
                bitIndex = 0;
                byteIndex++;
            }
        }
    }
    copyBits(source, sourceBitOffset, target, targetBitOffset, bitLength) {
        if (sourceBitOffset % 8 === 0 && targetBitOffset % 8 === 0 && bitLength % 8 === 0) {
            source.copy(target, targetBitOffset / 8, sourceBitOffset / 8, sourceBitOffset + bitLength / 8);
        }
        else {
            const bits = this.readBits(source, sourceBitOffset, bitLength);
            if (bits.length <= 6) {
                this.writeBits(target, bits.readUIntBE(0, bits.length), targetBitOffset, bitLength, true);
            }
            else {
                for (let i = 0; i < bits.length; i++) {
                    const byte = bits.readUInt8(i);
                    this.writeBits(target, byte, targetBitOffset + i * 8, 8, true);
                }
            }
        }
    }
}
exports.default = OctetstreamCodec;
//# sourceMappingURL=octetstream-codec.js.map