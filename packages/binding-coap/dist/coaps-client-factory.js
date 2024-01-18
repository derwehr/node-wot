"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const coaps_client_1 = __importDefault(require("./coaps-client"));
const { debug } = (0, core_1.createLoggers)("binding-coap", "coaps-client-factory");
class CoapsClientFactory {
    constructor() {
        this.scheme = "coaps";
    }
    getClient() {
        debug(`CoapsClientFactory creating client for '${this.scheme}'`);
        return new coaps_client_1.default();
    }
    init() {
        return true;
    }
    destroy() {
        return true;
    }
}
exports.default = CoapsClientFactory;
//# sourceMappingURL=coaps-client-factory.js.map