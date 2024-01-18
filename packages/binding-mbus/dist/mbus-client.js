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
const core_1 = require("@node-wot/core");
const mbus_connection_1 = require("./mbus-connection");
const debug = (0, core_1.createDebugLogger)("binding-mbus", "mbus-client");
const DEFAULT_PORT = 805;
const DEFAULT_TIMEOUT = 1000;
class MBusClient {
    constructor() {
        this._connections = new Map();
    }
    readResource(form) {
        return this.performOperation(form);
    }
    writeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
    invokeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
    unlinkResource(form) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
    subscribeResource(form, next, error, complete) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
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
    performOperation(form) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const parsed = new URL(form.href);
            const port = parsed.port ? parseInt(parsed.port, 10) : DEFAULT_PORT;
            form = this.validateAndFillDefaultForm(form);
            const host = parsed.hostname;
            const hostAndPort = host + ":" + port;
            this.overrideFormFromURLPath(form);
            let connection = this._connections.get(hostAndPort);
            if (!connection) {
                debug(`Creating new MbusConnection for ${hostAndPort}`);
                this._connections.set(hostAndPort, new mbus_connection_1.MBusConnection(host, port, { connectionTimeout: (_a = form["mbus:timeout"]) !== null && _a !== void 0 ? _a : DEFAULT_TIMEOUT }));
                connection = this._connections.get(hostAndPort);
                if (!connection) {
                    debug(`MbusConnection undefined`);
                    throw new Error("MbusConnection undefined");
                }
            }
            else {
                debug(`Reusing MbusConnection for ${hostAndPort}`);
            }
            const operation = new mbus_connection_1.PropertyOperation(form);
            connection.enqueue(operation);
            return connection.execute(operation);
        });
    }
    overrideFormFromURLPath(input) {
        const parsed = new URL(input.href);
        const pathComp = parsed.pathname.split("/");
        const query = parsed.searchParams;
        input["mbus:unitID"] = parseInt(pathComp[1], 10) || input["mbus:unitID"];
        const stringOffset = query.get("offset");
        if (stringOffset !== null) {
            input["mbus:offset"] = parseInt(stringOffset, 10);
        }
        const stringTimeout = query.get("timeout");
        if (stringTimeout !== null) {
            input["mbus:timeout"] = parseInt(stringTimeout, 10);
        }
    }
    validateAndFillDefaultForm(form) {
        var _a;
        const result = Object.assign({}, form);
        if (form["mbus:unitID"] === undefined || form["mbus:unitID"] === null) {
            throw new Error("Malformed form: unitID must be defined");
        }
        if (form["mbus:offset"] === undefined || form["mbus:offset"] === null) {
            throw new Error("Malformed form: offset must be defined");
        }
        result["mbus:timeout"] = (_a = form["mbus:timeout"]) !== null && _a !== void 0 ? _a : DEFAULT_TIMEOUT;
        return result;
    }
}
exports.default = MBusClient;
//# sourceMappingURL=mbus-client.js.map