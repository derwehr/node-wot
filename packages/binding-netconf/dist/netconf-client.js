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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const netconf_1 = require("./netconf");
const AsyncNodeNetcon = __importStar(require("./async-node-netconf"));
const url_parse_1 = __importDefault(require("url-parse"));
const stream_1 = require("stream");
const { debug, warn } = (0, core_1.createLoggers)("binding-netconf", "netconf-client");
const DEFAULT_TARGET = "candidate";
class NetconfClient {
    constructor() {
        this.client = new AsyncNodeNetcon.Client();
        this.credentials = { username: "" };
    }
    toString() {
        return "[NetconfClient]";
    }
    methodFromForm(form, defaultMethod) {
        const method = form["nc:method"];
        if ((0, netconf_1.isRpcMethod)(method)) {
            return method;
        }
        return defaultMethod;
    }
    readResource(form) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = new url_parse_1.default(form.href);
            const ipAddress = url.hostname;
            const port = parseInt(url.port);
            const xpathQuery = url.pathname;
            const method = this.methodFromForm(form, "GET-CONFIG");
            const NSs = (_a = form["nc:NSs"]) !== null && _a !== void 0 ? _a : {};
            const target = (_b = form["nc:target"]) !== null && _b !== void 0 ? _b : DEFAULT_TARGET;
            const contentType = "application/yang-data+xml";
            if (this.client.getRouter() === null) {
                try {
                    yield this.client.initializeRouter(ipAddress, port, this.credentials);
                    yield this.client.openRouter();
                }
                catch (err) {
                    this.client.deleteRouter();
                    throw err;
                }
            }
            const result = JSON.stringify(yield this.client.rpc(xpathQuery, method, NSs, target));
            return new core_1.Content(contentType, stream_1.Readable.from(Buffer.from(result)));
        });
    }
    writeResource(form, content) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const body = yield content.toBuffer();
            let payload = JSON.parse(body.toString());
            const url = new url_parse_1.default(form.href);
            const ipAddress = url.hostname;
            const port = parseInt(url.port);
            const xpathQuery = url.pathname;
            const method = this.methodFromForm(form, "EDIT-CONFIG");
            let NSs = (_a = form["nc:NSs"]) !== null && _a !== void 0 ? _a : {};
            const target = (_b = form["nc:target"]) !== null && _b !== void 0 ? _b : DEFAULT_TARGET;
            if (this.client.getRouter() === null) {
                try {
                    yield this.client.initializeRouter(ipAddress, port, this.credentials);
                    yield this.client.openRouter();
                }
                catch (err) {
                    this.client.deleteRouter();
                    throw err;
                }
            }
            NSs = Object.assign(Object.assign({}, NSs), payload.NSs);
            payload = payload.payload;
            yield this.client.rpc(xpathQuery, method, NSs, target, payload);
            return new Promise((resolve, reject) => {
                resolve(undefined);
            });
        });
    }
    invokeResource(form, content) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const body = yield content.toBuffer();
            let payload = JSON.parse(body.toString());
            const url = new url_parse_1.default(form.href);
            const ipAddress = url.hostname;
            const port = parseInt(url.port);
            const xpathQuery = url.pathname;
            const method = this.methodFromForm(form, "RPC");
            let NSs = (_a = form["nc:NSs"]) !== null && _a !== void 0 ? _a : {};
            const target = (_b = form["nc:target"]) !== null && _b !== void 0 ? _b : DEFAULT_TARGET;
            let result;
            if (this.client.getRouter() === null) {
                try {
                    yield this.client.initializeRouter(ipAddress, port, this.credentials);
                    yield this.client.openRouter();
                }
                catch (err) {
                    this.client.deleteRouter();
                    throw err;
                }
            }
            try {
                NSs = Object.assign(Object.assign({}, NSs), payload.NSs);
                payload = payload.payload;
                result = JSON.stringify(yield this.client.rpc(xpathQuery, method, NSs, target, payload));
            }
            catch (err) {
                debug(JSON.stringify(err));
                throw err;
            }
            const contentType = "application/yang-data+xml";
            return new core_1.Content(contentType, stream_1.Readable.from(result));
        });
    }
    unlinkResource(form) {
        return new Promise((resolve, reject) => {
            reject(new Error(`NetconfClient does not implement unlink`));
        });
    }
    subscribeResource(form, next, error, complete) {
        return __awaiter(this, void 0, void 0, function* () {
            const unimplementedError = new Error(`NetconfClient does not implement subscribe`);
            error === null || error === void 0 ? void 0 : error(unimplementedError);
            throw unimplementedError;
        });
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
            warn(`NetconfClient without security`);
            return false;
        }
        if ((credentials === null || credentials === void 0 ? void 0 : credentials.password) == null && (credentials === null || credentials === void 0 ? void 0 : credentials.privateKey) == null) {
            throw new Error(`Both password and privateKey missing inside credentials`);
        }
        this.credentials = credentials;
        return true;
    }
}
exports.default = NetconfClient;
//# sourceMappingURL=netconf-client.js.map