"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const ws_client_1 = __importDefault(require("./ws-client"));
const { debug } = (0, core_1.createLoggers)("binding-websockets", "ws-client-factory");
class WebSocketClientFactory {
    constructor(proxy = null) {
        this.scheme = "ws";
        this.clientSideProxy = null;
        this.clientSideProxy = proxy;
    }
    getClient() {
        debug(`HttpClientFactory creating client for '${this.scheme}'`);
        return new ws_client_1.default();
    }
    init() {
        return true;
    }
    destroy() {
        return true;
    }
}
exports.default = WebSocketClientFactory;
//# sourceMappingURL=ws-client-factory.js.map