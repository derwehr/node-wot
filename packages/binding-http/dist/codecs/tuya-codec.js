"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpTuyaCodec {
    getMediaType() {
        return "application/json+tuya";
    }
    bytesToValue(bytes, schema, parameters) {
        var _a, _b, _c;
        const parsedBody = JSON.parse(bytes.toString());
        const success = (_a = parsedBody.success) !== null && _a !== void 0 ? _a : false;
        if (!success) {
            throw new Error((_b = parsedBody.msg) !== null && _b !== void 0 ? _b : JSON.stringify(parsedBody));
        }
        for (const value of Object.values((_c = parsedBody.result) !== null && _c !== void 0 ? _c : {})) {
            if (value.code === schema["tuya:PropertyName"]) {
                return value;
            }
        }
        throw new Error("Property not found");
    }
    valueToBytes(value, schema, parameters) {
        const obj = {
            commands: [
                {
                    code: schema["tuya:PropertyName"],
                    value,
                },
            ],
        };
        const body = JSON.stringify(obj);
        return Buffer.from(body);
    }
}
exports.default = HttpTuyaCodec;
//# sourceMappingURL=tuya-codec.js.map