"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const mbus_client_1 = __importDefault(require("./mbus-client"));
const info = (0, core_1.createInfoLogger)("binding-mbus", "mbus-client-factory");
class MBusClientFactory {
    constructor() {
        this.scheme = "mbus+tcp";
    }
    getClient() {
        info(`MBusClientFactory creating client for '${this.scheme}'`);
        return new mbus_client_1.default();
    }
    init() {
        return true;
    }
    destroy() {
        return true;
    }
}
exports.default = MBusClientFactory;
//# sourceMappingURL=mbus-client-factory.js.map