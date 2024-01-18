"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const modbus_client_1 = __importDefault(require("./modbus-client"));
const debug = (0, core_1.createDebugLogger)("binding-modbus", "modbus-client-factory");
const warn = (0, core_1.createWarnLogger)("binding-modbus", "modbus-client-factory");
class ModbusClientFactory {
    constructor() {
        this.scheme = "modbus+tcp";
    }
    getClient() {
        debug(`Get client for '${this.scheme}'`);
        this.init();
        return this.singleton;
    }
    init() {
        if (!this.singleton) {
            debug(`Initializing client for '${this.scheme}'`);
            this.singleton = new modbus_client_1.default();
        }
        return true;
    }
    destroy() {
        debug(`Destroying client for '${this.scheme}'`);
        if (!this.singleton) {
            warn(`Destroying a not initialized client factory for '${this.scheme}'`);
            return true;
        }
        this.singleton.stop();
        this.singleton = undefined;
        return true;
    }
}
exports.default = ModbusClientFactory;
//# sourceMappingURL=modbus-client-factory.js.map