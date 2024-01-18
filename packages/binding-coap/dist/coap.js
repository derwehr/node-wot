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
exports.blockSizeToOptionValue = exports.isSupportedCoapMethod = exports.isValidCoapMethod = exports.CoapForm = exports.CoapsClient = exports.CoapsClientFactory = exports.CoapClient = exports.CoapClientFactory = exports.CoapServer = void 0;
const td_tools_1 = require("@node-wot/td-tools");
var coap_server_1 = require("./coap-server");
Object.defineProperty(exports, "CoapServer", { enumerable: true, get: function () { return __importDefault(coap_server_1).default; } });
var coap_client_factory_1 = require("./coap-client-factory");
Object.defineProperty(exports, "CoapClientFactory", { enumerable: true, get: function () { return __importDefault(coap_client_factory_1).default; } });
var coap_client_1 = require("./coap-client");
Object.defineProperty(exports, "CoapClient", { enumerable: true, get: function () { return __importDefault(coap_client_1).default; } });
var coaps_client_factory_1 = require("./coaps-client-factory");
Object.defineProperty(exports, "CoapsClientFactory", { enumerable: true, get: function () { return __importDefault(coaps_client_factory_1).default; } });
var coaps_client_1 = require("./coaps-client");
Object.defineProperty(exports, "CoapsClient", { enumerable: true, get: function () { return __importDefault(coaps_client_1).default; } });
__exportStar(require("./coap-server"), exports);
__exportStar(require("./coap-client-factory"), exports);
__exportStar(require("./coap-client"), exports);
__exportStar(require("./coaps-client-factory"), exports);
__exportStar(require("./coaps-client"), exports);
class CoapForm extends td_tools_1.Form {
}
exports.CoapForm = CoapForm;
function isValidCoapMethod(methodName) {
    return ["GET", "POST", "PUT", "DELETE", "FETCH", "PATCH", "iPATCH"].includes(methodName);
}
exports.isValidCoapMethod = isValidCoapMethod;
function isSupportedCoapMethod(methodName) {
    return ["GET", "POST", "PUT", "DELETE"].includes(methodName);
}
exports.isSupportedCoapMethod = isSupportedCoapMethod;
function blockSizeToOptionValue(blockSize) {
    switch (blockSize) {
        case 16:
            return 0;
        case 32:
            return 1;
        case 64:
            return 2;
        case 128:
            return 3;
        case 256:
            return 4;
        case 512:
            return 5;
        case 1024:
            return 6;
        default:
            throw Error(`Expected one of 16, 32, 64, 128, 256, 512, or 1024 as blockSize value, got ${blockSize}.`);
    }
}
exports.blockSizeToOptionValue = blockSizeToOptionValue;
//# sourceMappingURL=coap.js.map