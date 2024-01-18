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
exports.WebSocketSecureClientFactory = exports.WebSocketClientFactory = exports.WebSocketClient = void 0;
var ws_client_1 = require("./ws-client");
Object.defineProperty(exports, "WebSocketClient", { enumerable: true, get: function () { return __importDefault(ws_client_1).default; } });
var ws_client_factory_1 = require("./ws-client-factory");
Object.defineProperty(exports, "WebSocketClientFactory", { enumerable: true, get: function () { return __importDefault(ws_client_factory_1).default; } });
var wss_client_factory_1 = require("./wss-client-factory");
Object.defineProperty(exports, "WebSocketSecureClientFactory", { enumerable: true, get: function () { return __importDefault(wss_client_factory_1).default; } });
__exportStar(require("./ws-client"), exports);
__exportStar(require("./ws-client-factory"), exports);
__exportStar(require("./wss-client-factory"), exports);
//# sourceMappingURL=ws-browser.js.map