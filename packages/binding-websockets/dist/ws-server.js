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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const url = __importStar(require("url"));
const fs = __importStar(require("fs"));
const WebSocket = __importStar(require("ws"));
const TD = __importStar(require("@node-wot/td-tools"));
const core_1 = require("@node-wot/core");
const binding_http_1 = require("@node-wot/binding-http");
const slugify_1 = __importDefault(require("slugify"));
const { debug, info, error } = (0, core_1.createLoggers)("binding-websockets", "ws-server");
class WebSocketServer {
    constructor(serverOrConfig = {}) {
        this.PROPERTY_DIR = "properties";
        this.ACTION_DIR = "actions";
        this.EVENT_DIR = "events";
        this.port = 8081;
        this.address = undefined;
        this.ownServer = true;
        this.thingNames = new Set();
        this.thingPaths = new Map();
        this.socketServers = {};
        if (serverOrConfig instanceof binding_http_1.HttpServer && typeof serverOrConfig.getServer === "function") {
            this.ownServer = false;
            this.httpServer = serverOrConfig.getServer();
            this.port = serverOrConfig.getPort();
            this.scheme = serverOrConfig.scheme === "https" ? "wss" : "ws";
        }
        else if (typeof serverOrConfig === "object") {
            const config = serverOrConfig;
            if (config.port !== undefined) {
                this.port = config.port;
            }
            if (config.address !== undefined) {
                this.address = config.address;
            }
            if (config.serverKey != null && config.serverCert != null) {
                const options = {
                    key: fs.readFileSync(config.serverKey),
                    cert: fs.readFileSync(config.serverCert),
                };
                this.scheme = "wss";
                this.httpServer = https.createServer(options);
            }
            else {
                this.scheme = "ws";
                this.httpServer = http.createServer();
            }
        }
        else {
            throw new Error(`WebSocketServer constructor argument must be HttpServer, HttpConfig, or undefined`);
        }
    }
    start(servient) {
        debug(`WebSocketServer starting on ${this.address !== undefined ? this.address + " " : ""}port ${this.port}`);
        return new Promise((resolve, reject) => {
            this.httpServer.on("upgrade", (request, socket, head) => {
                var _a;
                const pathname = new url.URL((_a = request.url) !== null && _a !== void 0 ? _a : "", `${this.scheme}://${request.headers.host}`).pathname;
                const socketServer = this.socketServers[pathname];
                if (socketServer != null) {
                    socketServer.handleUpgrade(request, socket, head, (ws) => {
                        socketServer.emit("connection", ws, request);
                    });
                }
                else {
                    socket.destroy();
                }
            });
            if (this.ownServer) {
                this.httpServer.once("error", (err) => {
                    reject(err);
                });
                this.httpServer.once("listening", () => {
                    this.httpServer.on("error", (err) => {
                        error(`WebSocketServer on port ${this.port} failed: ${err.message}`);
                    });
                    resolve();
                });
                this.httpServer.listen(this.port, this.address);
            }
            else {
                resolve();
            }
        });
    }
    stop() {
        debug(`WebSocketServer stopping on port ${this.port}`);
        return new Promise((resolve, reject) => {
            for (const pathSocket in this.socketServers) {
                this.socketServers[pathSocket].close();
            }
            if (this.ownServer) {
                debug("WebSocketServer stopping own HTTP server");
                this.httpServer.once("error", (err) => {
                    reject(err);
                });
                this.httpServer.once("close", () => {
                    resolve();
                });
                this.httpServer.close();
            }
        });
    }
    getPort() {
        if (this.httpServer.address() != null && typeof this.httpServer.address() === "object") {
            return this.httpServer.address().port;
        }
        else {
            return -1;
        }
    }
    expose(thing) {
        var _a, _b;
        let urlPath = (0, slugify_1.default)(thing.title, { lower: true });
        if (this.thingNames.has(urlPath)) {
            urlPath = core_1.Helpers.generateUniqueName(urlPath);
        }
        if (this.getPort() !== -1) {
            debug(`WebSocketServer on port ${this.getPort()} exposes '${thing.title}' as unique '/${urlPath}/*'`);
            this.thingNames.add(urlPath);
            this.thingPaths.set(thing.id, urlPath);
            for (const propertyName in thing.properties) {
                const path = "/" +
                    encodeURIComponent(urlPath) +
                    "/" +
                    this.PROPERTY_DIR +
                    "/" +
                    encodeURIComponent(propertyName);
                const property = thing.properties[propertyName];
                for (const address of core_1.Helpers.getAddresses()) {
                    const href = `${this.scheme}://${address}:${this.getPort()}${path}`;
                    const form = new TD.Form(href, core_1.ContentSerdes.DEFAULT);
                    const ops = [];
                    const writeOnly = (_a = property.writeOnly) !== null && _a !== void 0 ? _a : false;
                    const readOnly = (_b = property.readOnly) !== null && _b !== void 0 ? _b : false;
                    if (!writeOnly) {
                        ops.push("readproperty", "observeproperty", "unobserveproperty");
                    }
                    if (!readOnly) {
                        ops.push("writeproperty");
                    }
                    form.op = ops;
                    thing.properties[propertyName].forms.push(form);
                    debug(`WebSocketServer on port ${this.getPort()} assigns '${href}' to Property '${propertyName}'`);
                }
                debug(`WebSocketServer on port ${this.getPort()} adding socketServer for '${path}'`);
                this.socketServers[path] = new WebSocket.Server({ noServer: true });
                this.socketServers[path].on("connection", (ws, req) => {
                    var _a;
                    debug(`WebSocketServer on port ${this.getPort()} received connection for '${path}' from ${core_1.Helpers.toUriLiteral(req.socket.remoteAddress)}:${req.socket.remotePort}`);
                    const observeListener = (content) => __awaiter(this, void 0, void 0, function* () {
                        var e_1, _b;
                        debug(`WebSocketServer on port ${this.getPort()} publishing to property '${propertyName}' `);
                        try {
                            for (var _c = __asyncValues(content.body), _d; _d = yield _c.next(), !_d.done;) {
                                const chunk = _d.value;
                                ws.send(chunk);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_d && !_d.done && (_b = _c.return)) yield _b.call(_c);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    });
                    const writeOnly = (_a = property.writeOnly) !== null && _a !== void 0 ? _a : false;
                    if (writeOnly) {
                        for (let formIndex = 0; formIndex < thing.properties[propertyName].forms.length; formIndex++) {
                            thing
                                .handleObserveProperty(propertyName, observeListener, { formIndex })
                                .catch((err) => ws.close(-1, err.message));
                        }
                    }
                    ws.on("close", () => {
                        for (let formIndex = 0; formIndex < thing.properties[propertyName].forms.length; formIndex++) {
                            thing.handleUnobserveProperty(propertyName, observeListener, { formIndex });
                        }
                        debug(`WebSocketServer on port ${this.getPort()} closed connection for '${path}' from ${core_1.Helpers.toUriLiteral(req.socket.remoteAddress)}:${req.socket.remotePort}`);
                    });
                });
            }
            for (const actionName in thing.actions) {
                const path = "/" + encodeURIComponent(urlPath) + "/" + this.ACTION_DIR + "/" + encodeURIComponent(actionName);
                const action = thing.actions[actionName];
                for (const address of core_1.Helpers.getAddresses()) {
                    const href = `${this.scheme}://${address}:${this.getPort()}${path}`;
                    const form = new TD.Form(href, core_1.ContentSerdes.DEFAULT);
                    form.op = ["invokeaction"];
                    thing.actions[actionName].forms.push(form);
                    debug(`WebSocketServer on port ${this.getPort()} assigns '${href}' to Action '${actionName}'`);
                }
            }
            for (const eventName in thing.events) {
                const path = "/" + encodeURIComponent(urlPath) + "/" + this.EVENT_DIR + "/" + encodeURIComponent(eventName);
                const event = thing.events[eventName];
                for (const address of core_1.Helpers.getAddresses()) {
                    const href = `${this.scheme}://${address}:${this.getPort()}${path}`;
                    const form = new TD.Form(href, core_1.ContentSerdes.DEFAULT);
                    form.op = "subscribeevent";
                    event.forms.push(form);
                    debug(`WebSocketServer on port ${this.getPort()} assigns '${href}' to Event '${eventName}'`);
                }
                debug(`WebSocketServer on port ${this.getPort()} adding socketServer for '${path}'`);
                this.socketServers[path] = new WebSocket.Server({ noServer: true });
                this.socketServers[path].on("connection", (ws, req) => {
                    debug(`WebSocketServer on port ${this.getPort()} received connection for '${path}' from ${core_1.Helpers.toUriLiteral(req.socket.remoteAddress)}:${req.socket.remotePort}`);
                    const eventListener = (content) => __awaiter(this, void 0, void 0, function* () {
                        var e_2, _a;
                        try {
                            for (var _b = __asyncValues(content.body), _c; _c = yield _b.next(), !_c.done;) {
                                const chunk = _c.value;
                                ws.send(chunk);
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    });
                    for (let formIndex = 0; formIndex < event.forms.length; formIndex++) {
                        thing
                            .handleSubscribeEvent(eventName, eventListener, { formIndex })
                            .catch((err) => ws.close(-1, err.message));
                    }
                    ws.on("close", () => {
                        for (let formIndex = 0; formIndex < event.forms.length; formIndex++) {
                            thing.handleUnsubscribeEvent(eventName, eventListener, { formIndex });
                        }
                        debug(`WebSocketServer on port ${this.getPort()} closed connection for '${path}' from ${core_1.Helpers.toUriLiteral(req.socket.remoteAddress)}:${req.socket.remotePort}`);
                    });
                });
            }
        }
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
    destroy(thingId) {
        debug(`WebSocketServer on port ${this.getPort()} destroying thingId '${thingId}'`);
        return new Promise((resolve, reject) => {
            let removedThing = false;
            for (const name of Array.from(this.thingPaths.keys())) {
                const thingPath = this.thingPaths.get(name);
                removedThing = this.thingNames.delete(thingPath);
            }
            if (removedThing) {
                info(`WebSocketServer succesfully destroyed '${thingId}'`);
            }
            else {
                info(`WebSocketServer failed to destroy thing with thingId '${thingId}'`);
            }
            resolve(removedThing !== undefined);
        });
    }
}
exports.default = WebSocketServer;
//# sourceMappingURL=ws-server.js.map