"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const netconf_client_1 = __importDefault(require("./netconf-client"));
const netconf_codec_1 = __importDefault(require("./codecs/netconf-codec"));
const debug = (0, core_1.createDebugLogger)("binding-netconf", "netconf-client-factory");
class NetconfClientFactory {
    constructor() {
        this.scheme = "netconf";
        this.contentSerdes = core_1.ContentSerdes.get();
        this.init = () => true;
        this.destroy = () => true;
    }
    getClient() {
        this.contentSerdes.addCodec(new netconf_codec_1.default());
        debug(`NetconfClientFactory creating client for '${this.scheme}'`);
        return new netconf_client_1.default();
    }
}
exports.default = NetconfClientFactory;
//# sourceMappingURL=netconf-client-factory.js.map