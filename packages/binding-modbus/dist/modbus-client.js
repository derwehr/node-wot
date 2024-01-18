"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const modbus_1 = require("./modbus");
const core_1 = require("@node-wot/core");
const utils_1 = require("./utils");
const modbus_connection_1 = require("./modbus-connection");
const stream_1 = require("stream");
const Subscription_1 = require("rxjs/Subscription");
const debug = (0, core_1.createDebugLogger)("binding-modbus", "modbus-client");
const DEFAULT_PORT = 805;
const DEFAULT_TIMEOUT = 1000;
const DEFAULT_POLLING = 2000;
class ModbusSubscription {
    constructor(form, client, next, error, complete) {
        if (!complete) {
            complete = () => {
            };
        }
        this.interval = global.setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield client.readResource(form);
                next(result);
            }
            catch (e) {
                if (error) {
                    error(e instanceof Error ? e : new Error(JSON.stringify(e)));
                }
                clearInterval(this.interval);
            }
        }), form["modbus:pollingTime"]);
        this.complete = complete;
    }
    unsubscribe() {
        clearInterval(this.interval);
        this.complete();
    }
}
class ModbusClient {
    constructor() {
        this._subscriptions = new Map();
        this._connections = new Map();
    }
    readResource(form) {
        return this.performOperation(form);
    }
    writeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.performOperation(form, content);
        });
    }
    invokeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.performOperation(form, content);
            return new core_1.DefaultContent(stream_1.Readable.from(""));
        });
    }
    unlinkResource(form) {
        form = this.validateAndFillDefaultForm(form, 0);
        const id = `${form.href}/${form["modbus:unitID"]}#${form["modbus:function"]}?${form["modbus:address"]}&${form["modbus:quantity"]}`;
        const subscription = this._subscriptions.get(id);
        if (!subscription) {
            throw new Error("No subscription for " + id + " found");
        }
        subscription.unsubscribe();
        this._subscriptions.delete(id);
        return Promise.resolve();
    }
    subscribeResource(form, next, error, complete) {
        return new Promise((resolve, reject) => {
            form = this.validateAndFillDefaultForm(form, 0);
            const id = `${form.href}/${form["modbus:unitID"]}#${form["modbus:function"]}?${form["modbus:address"]}&${form["modbus:quantity"]}`;
            if (this._subscriptions.has(id)) {
                reject(new Error("Already subscribed for " + id + ". Multiple subscriptions are not supported"));
            }
            const subscription = new ModbusSubscription(form, this, next, error, complete);
            this._subscriptions.set(id, subscription);
            resolve(new Subscription_1.Subscription(() => {
                subscription.unsubscribe();
            }));
        });
    }
    requestThingDescription(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented");
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this._connections.forEach((connection) => {
                connection.close();
            });
        });
    }
    setSecurity(metadata, credentials) {
        return false;
    }
    performOperation(form, content) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const parsed = new URL(form.href);
            const port = parsed.port ? parseInt(parsed.port, 10) : DEFAULT_PORT;
            let body;
            if (content != null) {
                body = yield content.toBuffer();
            }
            const formValidated = this.validateAndFillDefaultForm(form, body === null || body === void 0 ? void 0 : body.byteLength);
            const endianness = this.validateEndianness(formValidated);
            const host = parsed.hostname;
            const hostAndPort = host + ":" + port;
            if (body != null) {
                this.validateBufferLength(formValidated, body);
            }
            let connection = this._connections.get(hostAndPort);
            if (!connection) {
                debug(`Creating new ModbusConnection for ${hostAndPort}`);
                connection = new modbus_connection_1.ModbusConnection(host, port, {
                    connectionTimeout: (_a = form["modbus:timeout"]) !== null && _a !== void 0 ? _a : DEFAULT_TIMEOUT,
                });
                this._connections.set(hostAndPort, connection);
            }
            else {
                debug(`Reusing ModbusConnection for ${hostAndPort}`);
            }
            const operation = new modbus_connection_1.PropertyOperation(formValidated, endianness, body);
            connection.enqueue(operation);
            return operation.execute();
        });
    }
    validateEndianness(form) {
        var _a;
        let endianness = core_1.Endianness.BIG_ENDIAN;
        if (form.contentType != null) {
            const contentValues = (_a = form.contentType.split(";")) !== null && _a !== void 0 ? _a : [];
            const byteSeq = contentValues.find((value) => /^byteSeq=/.test(value));
            if (byteSeq != null) {
                const guessEndianness = core_1.Endianness[byteSeq.split("=")[1]];
                if (guessEndianness != null) {
                    endianness = guessEndianness;
                }
                else {
                    throw new Error("Malformed form: Content Type endianness is not valid");
                }
            }
        }
        return endianness;
    }
    overrideFormFromURLPath(input) {
        const { pathname, searchParams: query } = new URL(input.href);
        const pathComp = pathname.split("/");
        input["modbus:unitID"] = parseInt(pathComp[1], 10) || input["modbus:unitID"];
        input["modbus:address"] = parseInt(pathComp[2], 10) || input["modbus:address"];
        const queryQuantity = query.get("quantity");
        if (queryQuantity != null) {
            input["modbus:quantity"] = parseInt(queryQuantity, 10);
        }
    }
    validateBufferLength(form, buffer) {
        const mpy = form["modbus:entity"] === "InputRegister" || form["modbus:entity"] === "HoldingRegister" ? 2 : 1;
        const quantity = form["modbus:quantity"];
        if (buffer.length !== mpy * quantity) {
            throw new Error("Content length does not match register / coil count, got " +
                buffer.length +
                " bytes for " +
                quantity +
                ` ${mpy === 2 ? "registers" : "coils"}`);
        }
    }
    validateAndFillDefaultForm(form, contentLength = 0) {
        var _a, _b;
        const mode = contentLength > 0 ? "w" : "r";
        this.overrideFormFromURLPath(form);
        const result = Object.assign({}, form);
        if (form["modbus:function"] == null && form["modbus:entity"] == null) {
            throw new Error("Malformed form: modbus:function or modbus:entity must be defined");
        }
        if (form["modbus:function"] != null) {
            if (typeof form["modbus:function"] === "string") {
                result["modbus:function"] = modbus_1.ModbusFunction[form["modbus:function"]];
            }
            if (!Object.keys(modbus_1.ModbusFunction).includes(form["modbus:function"].toString())) {
                throw new Error("Undefined function number or name: " + form["modbus:function"]);
            }
        }
        if (form["modbus:entity"]) {
            switch (form["modbus:entity"]) {
                case "Coil":
                    result["modbus:function"] =
                        mode === "r"
                            ? modbus_1.ModbusFunction.readCoil
                            : contentLength > 1
                                ? modbus_1.ModbusFunction.writeMultipleCoils
                                : modbus_1.ModbusFunction.writeSingleCoil;
                    break;
                case "HoldingRegister":
                    result["modbus:function"] =
                        mode === "r"
                            ? modbus_1.ModbusFunction.readHoldingRegisters
                            : contentLength / 2 > 1
                                ? modbus_1.ModbusFunction.writeMultipleHoldingRegisters
                                : modbus_1.ModbusFunction.writeSingleHoldingRegister;
                    break;
                case "InputRegister":
                    result["modbus:function"] = modbus_1.ModbusFunction.readInputRegister;
                    break;
                case "DiscreteInput":
                    result["modbus:function"] = modbus_1.ModbusFunction.readDiscreteInput;
                    break;
                default:
                    throw new Error("Unknown modbus entity: " + form["modbus:entity"]);
            }
        }
        else {
            result["modbus:entity"] = (0, utils_1.modbusFunctionToEntity)(result["modbus:function"]);
        }
        if (form["modbus:address"] === undefined || form["modbus:address"] === null) {
            throw new Error("Malformed form: address must be defined");
        }
        const hasQuantity = form["modbus:quantity"] != null;
        if (!hasQuantity && contentLength === 0) {
            result["modbus:quantity"] = 1;
        }
        else if (!hasQuantity && contentLength > 0) {
            const regSize = result["modbus:entity"] === "InputRegister" || result["modbus:entity"] === "HoldingRegister" ? 2 : 1;
            result["modbus:quantity"] = contentLength / regSize;
        }
        (_a = result["modbus:pollingTime"]) !== null && _a !== void 0 ? _a : (result["modbus:pollingTime"] = DEFAULT_POLLING);
        (_b = result["modbus:timeout"]) !== null && _b !== void 0 ? _b : (result["modbus:timeout"] = DEFAULT_TIMEOUT);
        return result;
    }
}
exports.default = ModbusClient;
//# sourceMappingURL=modbus-client.js.map