"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRpcMethod = exports.NetconfForm = exports.NetconfClientFactory = exports.NetconfClient = void 0;
const td_tools_1 = require("@node-wot/td-tools");
var netconf_client_1 = require("./netconf-client");
Object.defineProperty(exports, "NetconfClient", { enumerable: true, get: function () { return __importDefault(netconf_client_1).default; } });
var netconf_client_factory_1 = require("./netconf-client-factory");
Object.defineProperty(exports, "NetconfClientFactory", { enumerable: true, get: function () { return __importDefault(netconf_client_factory_1).default; } });
__exportStar(require("./netconf"), exports);
__exportStar(require("./netconf-client-factory"), exports);
class NetconfForm extends td_tools_1.Form {
}
exports.NetconfForm = NetconfForm;
function isRpcMethod(method) {
    if (method == null) {
        return false;
    }
    return ["GET-CONFIG", "EDIT-CONFIG", "COMMIT", "RPC"].includes(method);
}
exports.isRpcMethod = isRpcMethod;
//# sourceMappingURL=netconf.js.map