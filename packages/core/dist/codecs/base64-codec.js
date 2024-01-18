"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Base64Codec {
    constructor(subMediaType) {
        this.subMediaType = subMediaType;
    }
    getMediaType() {
        return this.subMediaType;
    }
    bytesToValue(bytes, schema, parameters) {
        const parsed = bytes.toString("ascii");
        return parsed;
    }
    valueToBytes(value, schema, parameters) {
        let body = "";
        if (value !== undefined) {
            body = JSON.stringify(value);
        }
        return Buffer.from(body, "base64");
    }
}
exports.default = Base64Codec;
//# sourceMappingURL=base64-codec.js.map