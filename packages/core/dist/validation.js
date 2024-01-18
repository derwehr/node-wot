"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastValidationErrors = exports.isThingDescription = void 0;
const helpers_1 = __importDefault(require("./helpers"));
function isThingDescription(input) {
    return helpers_1.default.tsSchemaValidator(input);
}
exports.isThingDescription = isThingDescription;
function getLastValidationErrors() {
    var _a;
    const errors = (_a = helpers_1.default.tsSchemaValidator.errors) === null || _a === void 0 ? void 0 : _a.map((o) => o.message).join("\n");
    return new Error(errors);
}
exports.getLastValidationErrors = getLastValidationErrors;
//# sourceMappingURL=validation.js.map