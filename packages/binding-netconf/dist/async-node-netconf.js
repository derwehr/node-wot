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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const nodeNetconf = __importStar(require("node-netconf"));
const xpath2json = __importStar(require("./xpath2json"));
const fs_1 = require("fs");
const core_1 = require("@node-wot/core");
const { debug, warn } = (0, core_1.createLoggers)("binding-netconf", "async-node-netconf");
const METHOD_OBJ = {
    "GET-CONFIG": {
        "get-config": {
            $: { xmlns: "urn:ietf:params:xml:ns:netconf:base:1.0" },
            source: { candidate: {} },
            filter: { $: { type: "subtree" } },
        },
    },
    "EDIT-CONFIG": {
        "edit-config": {
            $: { xmlns: "urn:ietf:params:xml:ns:netconf:base:1.0" },
            target: { candidate: {} },
            config: {},
        },
    },
    COMMIT: { commit: { $: { xmlns: "urn:ietf:params:xml:ns:netconf:base:1.0" } } },
    RPC: {},
};
class Client {
    constructor() {
        this.router = null;
        this.connected = false;
    }
    getRouter() {
        return this.router;
    }
    deleteRouter() {
        this.router = null;
    }
    initializeRouter(host, port, credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connected) {
                this.closeRouter();
            }
            this.routerParams = {
                host,
                port,
                username: credentials.username,
                password: credentials === null || credentials === void 0 ? void 0 : credentials.password,
            };
            const privateKey = credentials === null || credentials === void 0 ? void 0 : credentials.privateKey;
            if (privateKey != null) {
                this.routerParams.pkey = yield fs_1.promises.readFile(privateKey, { encoding: "utf8" });
            }
        });
    }
    openRouter() {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                this.closeRouter();
            }
            if (!this.routerParams) {
                reject(new Error("Router params not initialized"));
                return;
            }
            this.router = new nodeNetconf.Client(this.routerParams);
            this.router.open((err) => {
                var _a, _b, _c;
                if (err != null) {
                    reject(err);
                }
                else {
                    debug(`New NetConf router opened connection with host ${(_a = this.routerParams) === null || _a === void 0 ? void 0 : _a.host}, port ${(_b = this.routerParams) === null || _b === void 0 ? void 0 : _b.port}, username ${(_c = this.routerParams) === null || _c === void 0 ? void 0 : _c.username}`);
                    this.connected = true;
                    resolve(undefined);
                }
            });
        });
    }
    rpc(xpathQuery, method, NSs, target, payload) {
        return new Promise((resolve, reject) => {
            if (payload != null) {
                xpathQuery = xpath2json.addLeaves(xpathQuery, payload);
            }
            const objRequest = xpath2json.xpath2json(xpathQuery, NSs);
            let finalRequest = JSON.parse(JSON.stringify(METHOD_OBJ[method]));
            switch (method) {
                case "EDIT-CONFIG": {
                    finalRequest["edit-config"].config = Object.assign(finalRequest["edit-config"].config, objRequest);
                    finalRequest["edit-config"].target = {};
                    finalRequest["edit-config"].target[target] = {};
                    break;
                }
                case "COMMIT": {
                    break;
                }
                case "RPC": {
                    finalRequest = objRequest;
                    break;
                }
                case "GET-CONFIG":
                default: {
                    finalRequest["get-config"].filter = Object.assign(finalRequest["get-config"].filter, objRequest);
                    finalRequest["get-config"].source = {};
                    finalRequest["get-config"].source[target] = {};
                    break;
                }
            }
            if (this.router === null) {
                reject(new Error("Router not initialized"));
                return;
            }
            this.router.rpc(finalRequest, (err, results) => {
                if (err) {
                    reject(err);
                }
                resolve(results);
            });
        });
    }
    closeRouter() {
        var _a;
        if (this.router === null) {
            warn("Closing an already cleared router.");
        }
        (_a = this.router) === null || _a === void 0 ? void 0 : _a.close();
        this.connected = false;
    }
}
exports.Client = Client;
//# sourceMappingURL=async-node-netconf.js.map