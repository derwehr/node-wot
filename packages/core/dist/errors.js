"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSchemaError = exports.NotSupportedError = exports.NotReadableError = void 0;
class NotReadableError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, NotReadableError.prototype);
    }
}
exports.NotReadableError = NotReadableError;
class NotSupportedError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, NotSupportedError.prototype);
    }
}
exports.NotSupportedError = NotSupportedError;
class DataSchemaError extends Error {
    constructor(message, value) {
        super(message);
        this.value = value;
        Object.setPrototypeOf(this, NotSupportedError.prototype);
    }
}
exports.DataSchemaError = DataSchemaError;
//# sourceMappingURL=errors.js.map