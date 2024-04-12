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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpForm = exports.HttpHeader = exports.HttpsClientFactory = exports.HttpClientFactory = exports.HttpClient = exports.HttpServer = void 0;
const TD = __importStar(require("@node-wot/td-tools"));
var http_server_1 = require("./http-server");
Object.defineProperty(exports, "HttpServer", { enumerable: true, get: function () { return __importDefault(http_server_1).default; } });
var http_client_1 = require("./http-client");
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return __importDefault(http_client_1).default; } });
var http_client_factory_1 = require("./http-client-factory");
Object.defineProperty(exports, "HttpClientFactory", { enumerable: true, get: function () { return __importDefault(http_client_factory_1).default; } });
var https_client_factory_1 = require("./https-client-factory");
Object.defineProperty(exports, "HttpsClientFactory", { enumerable: true, get: function () { return __importDefault(https_client_factory_1).default; } });
__exportStar(require("./http-server"), exports);
__exportStar(require("./http-client"), exports);
__exportStar(require("./http-client-factory"), exports);
__exportStar(require("./https-client-factory"), exports);
class HttpHeader {
}
exports.HttpHeader = HttpHeader;
class HttpForm extends TD.Form {
}
exports.HttpForm = HttpForm;
//# sourceMappingURL=http.js.map