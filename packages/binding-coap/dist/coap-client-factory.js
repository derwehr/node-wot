"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const coap_client_1 = __importDefault(require("./coap-client"));
const { debug } = (0, core_1.createLoggers)("binding-coap", "coap-client-factory");
class CoapClientFactory {
    constructor(server) {
        this.scheme = "coap";
        this.server = server;
    }
    getClient() {
        debug(`CoapClientFactory creating client for '${this.scheme}'`);
        return new coap_client_1.default(this.server);
    }
    init() {
        return true;
    }
    destroy() {
        return true;
    }
}
exports.default = CoapClientFactory;
//# sourceMappingURL=coap-client-factory.js.map