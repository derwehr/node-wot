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
exports.OPCUAClientFactory = void 0;
const core_1 = require("@node-wot/core");
const codec_1 = require("./codec");
const opcua_protocol_client_1 = require("./opcua-protocol-client");
const { debug } = (0, core_1.createLoggers)("binding-opcua", "factory");
class OPCUAClientFactory {
    constructor() {
        this.scheme = "opc.tcp";
        this._clients = [];
        this.contentSerdes = core_1.ContentSerdes.get();
        this.contentSerdes.addCodec(new codec_1.OpcuaJSONCodec());
        this.contentSerdes.addCodec(new codec_1.OpcuaBinaryCodec());
    }
    getClient() {
        debug(`OpcuaClientFactory creating client for '${this.scheme}'`);
        if (this._clients[0] != null) {
            return this._clients[0];
        }
        this._clients[0] = new opcua_protocol_client_1.OPCUAProtocolClient();
        return this._clients[0];
    }
    init() {
        debug("init");
        return true;
    }
    destroy() {
        debug("destroy");
        const clients = this._clients;
        this._clients = [];
        (() => __awaiter(this, void 0, void 0, function* () {
            for (const client of clients) {
                yield client.stop();
            }
        }))();
        return true;
    }
}
exports.OPCUAClientFactory = OPCUAClientFactory;
//# sourceMappingURL=factory.js.map