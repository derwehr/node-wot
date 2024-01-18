"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WssClientFactory {
    constructor() {
        this.scheme = "wss";
    }
    getClient() {
        throw new Error("WssClientFactory for 'wss' is not implemented");
    }
    init() {
        return true;
    }
    destroy() {
        return true;
    }
}
exports.default = WssClientFactory;
//# sourceMappingURL=wss-client-factory.js.map