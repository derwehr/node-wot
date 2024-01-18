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
const core_1 = require("@node-wot/core");
const { debug, warn } = (0, core_1.createLoggers)("binding-websockets", "ws-client");
class WebSocketClient {
    constructor() {
    }
    toString() {
        return `[WebSocketClient]`;
    }
    readResource(form) {
        return new Promise((resolve, reject) => {
        });
    }
    writeResource(form, content) {
        return new Promise((resolve, reject) => {
        });
    }
    invokeResource(form, content) {
        return new Promise((resolve, reject) => {
        });
    }
    unlinkResource(form) {
        return new Promise((resolve, reject) => {
        });
    }
    subscribeResource(form, next, error, complete) {
        throw new Error("Websocket client does not implement subscribeResource");
    }
    requestThingDescription(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented");
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    setSecurity(metadata, credentials) {
        if (metadata === undefined || !Array.isArray(metadata) || metadata.length === 0) {
            warn("WebSocketClient received empty security metadata");
            return false;
        }
        const security = metadata[0];
        debug(`WebSocketClient using security scheme '${security.scheme}'`);
        return true;
    }
}
exports.default = WebSocketClient;
//# sourceMappingURL=ws-client.js.map