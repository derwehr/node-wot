"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _InteractionOutput_content, _InteractionOutput_value, _InteractionOutput_buffer, _InteractionOutput_stream;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionOutput = void 0;
const util = __importStar(require("util"));
const content_serdes_1 = require("./content-serdes");
const core_1 = require("./core");
const errors_1 = require("./errors");
const ajv_1 = __importDefault(require("ajv"));
const logger_1 = require("./logger");
const { debug } = (0, logger_1.createLoggers)("core", "interaction-output");
const ajv = new ajv_1.default({ strict: false });
class InteractionOutput {
    constructor(content, form, schema) {
        _InteractionOutput_content.set(this, void 0);
        _InteractionOutput_value.set(this, void 0);
        _InteractionOutput_buffer.set(this, void 0);
        _InteractionOutput_stream.set(this, void 0);
        __classPrivateFieldSet(this, _InteractionOutput_content, content, "f");
        this.form = form;
        this.schema = schema;
        this.dataUsed = false;
    }
    get data() {
        if (__classPrivateFieldGet(this, _InteractionOutput_stream, "f")) {
            return __classPrivateFieldGet(this, _InteractionOutput_stream, "f");
        }
        if (this.dataUsed) {
            throw new Error("Can't read the stream once it has been already used");
        }
        this.dataUsed = true;
        return (__classPrivateFieldSet(this, _InteractionOutput_stream, core_1.ProtocolHelpers.toWoTStream(__classPrivateFieldGet(this, _InteractionOutput_content, "f").body), "f"));
    }
    arrayBuffer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _InteractionOutput_buffer, "f")) {
                return __classPrivateFieldGet(this, _InteractionOutput_buffer, "f");
            }
            if (this.dataUsed) {
                throw new Error("Can't read the stream once it has been already used");
            }
            const data = yield __classPrivateFieldGet(this, _InteractionOutput_content, "f").toBuffer();
            this.dataUsed = true;
            __classPrivateFieldSet(this, _InteractionOutput_buffer, data, "f");
            return data;
        });
    }
    value() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _InteractionOutput_value, "f") !== undefined) {
                return __classPrivateFieldGet(this, _InteractionOutput_value, "f");
            }
            if (this.dataUsed) {
                throw new errors_1.NotReadableError("Can't read the stream once it has been already used");
            }
            if (this.form == null) {
                throw new errors_1.NotReadableError("No form defined");
            }
            if (this.schema == null || this.schema.type == null) {
                throw new errors_1.NotReadableError("No schema defined");
            }
            if (!content_serdes_1.ContentSerdes.get().isSupported(__classPrivateFieldGet(this, _InteractionOutput_content, "f").type)) {
                const message = `Content type ${__classPrivateFieldGet(this, _InteractionOutput_content, "f").type} not supported`;
                throw new errors_1.NotSupportedError(message);
            }
            const bytes = yield __classPrivateFieldGet(this, _InteractionOutput_content, "f").toBuffer();
            this.dataUsed = true;
            __classPrivateFieldSet(this, _InteractionOutput_buffer, bytes, "f");
            const json = content_serdes_1.ContentSerdes.get().contentToValue({ type: __classPrivateFieldGet(this, _InteractionOutput_content, "f").type, body: bytes }, this.schema);
            const validate = ajv.compile(this.schema);
            if (!validate(json)) {
                debug(`schema = ${util.inspect(this.schema, { depth: 10, colors: true })}`);
                debug(`value: ${json}`);
                debug(`Errror: ${validate.errors}`);
                throw new errors_1.DataSchemaError("Invalid value according to DataSchema", json);
            }
            __classPrivateFieldSet(this, _InteractionOutput_value, json, "f");
            return json;
        });
    }
}
exports.InteractionOutput = InteractionOutput;
_InteractionOutput_content = new WeakMap(), _InteractionOutput_value = new WeakMap(), _InteractionOutput_buffer = new WeakMap(), _InteractionOutput_stream = new WeakMap();
//# sourceMappingURL=interaction-output.js.map