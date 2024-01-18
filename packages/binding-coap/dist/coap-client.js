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
const url = __importStar(require("url"));
const net = __importStar(require("net"));
const Subscription_1 = require("rxjs/Subscription");
const core_1 = require("@node-wot/core");
const coap_1 = require("./coap");
const stream_1 = require("stream");
const coap_2 = require("coap");
const { debug, warn } = (0, core_1.createLoggers)("binding-coap", "coap-client");
class CoapClient {
    constructor(server) {
        this.setSecurity = (metadata) => true;
        this.agent = new coap_2.Agent(server ? { socket: server.getSocket() } : undefined);
        this.agentOptions = server ? { socket: server.getSocket() } : {};
        (0, coap_2.registerFormat)(core_1.ContentSerdes.JSON_LD, 2100);
    }
    toString() {
        return "[CoapClient]";
    }
    readResource(form) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = yield this.generateRequest(form, "GET");
            debug(`CoapClient sending ${req.statusCode} to ${form.href}`);
            return new Promise((resolve, reject) => {
                req.on("response", (res) => {
                    var _a;
                    debug(`CoapClient received ${res.code} from ${form.href}`);
                    debug(`CoapClient received Content-Format: ${res.headers["Content-Format"]}`);
                    const contentType = (_a = res.headers["Content-Format"]) !== null && _a !== void 0 ? _a : form.contentType;
                    resolve(new core_1.Content(contentType, stream_1.Readable.from(res.payload)));
                });
                req.on("error", (err) => reject(err));
                req.end();
            });
        });
    }
    writeResource(form, content) {
        return new Promise((resolve, reject) => {
            content
                .toBuffer()
                .then((buffer) => {
                const req = this.generateRequest(form, "PUT");
                debug(`CoapClient sending ${req.statusCode} to ${form.href}`);
                req.on("response", (res) => {
                    debug(`CoapClient received ${res.code} from ${form.href}`);
                    debug(`CoapClient received headers: ${JSON.stringify(res.headers)}`);
                    resolve();
                });
                req.on("error", (err) => reject(err));
                req.setOption("Content-Format", content.type);
                req.write(buffer);
                req.end();
            })
                .catch(reject);
        });
    }
    invokeResource(form, content) {
        return new Promise((resolve, reject) => {
            const req = this.generateRequest(form, "POST");
            debug(`CoapClient sending ${req.statusCode} to ${form.href}`);
            req.on("response", (res) => {
                debug(`CoapClient received ${res.code} from ${form.href}`);
                debug(`CoapClient received Content-Format: ${res.headers["Content-Format"]}`);
                debug(`CoapClient received headers: ${JSON.stringify(res.headers)}`);
                const contentType = res.headers["Content-Format"];
                resolve(new core_1.Content(contentType !== null && contentType !== void 0 ? contentType : "", stream_1.Readable.from(res.payload)));
            });
            req.on("error", (err) => reject(err));
            (() => __awaiter(this, void 0, void 0, function* () {
                if (content != null) {
                    const buffer = yield content.toBuffer();
                    req.setOption("Content-Format", content.type);
                    req.write(buffer);
                }
                req.end();
            }))();
        });
    }
    unlinkResource(form) {
        return new Promise((resolve, reject) => {
            const req = this.generateRequest(form, "GET", false);
            debug(`CoapClient sending ${req.statusCode} to ${form.href}`);
            req.on("response", (res) => {
                debug(`CoapClient received ${res.code} from ${form.href}`);
                debug(`CoapClient received headers: ${JSON.stringify(res.headers)}`);
                resolve();
            });
            req.on("error", (err) => reject(err));
            req.end();
        });
    }
    subscribeResource(form, next, error, complete) {
        return new Promise((resolve, reject) => {
            const req = this.generateRequest(form, "GET", true);
            debug(`CoapClient sending ${req.statusCode} to ${form.href}`);
            req.on("response", (res) => {
                var _a, _b;
                debug(`CoapClient received ${res.code} from ${form.href}`);
                debug(`CoapClient received Content-Format: ${res.headers["Content-Format"]}`);
                const contentType = (_b = (_a = res.headers["Content-Format"]) !== null && _a !== void 0 ? _a : form.contentType) !== null && _b !== void 0 ? _b : core_1.ContentSerdes.DEFAULT;
                res.on("data", (data) => {
                    next(new core_1.Content(`${contentType}`, stream_1.Readable.from(res.payload)));
                });
                resolve(new Subscription_1.Subscription(() => {
                    res.close();
                    if (complete)
                        complete();
                }));
            });
            req.on("error", (err) => {
                if (error) {
                    error(err);
                }
            });
            req.end();
        });
    }
    requestThingDescription(uri) {
        const options = this.uriToOptions(uri);
        const req = this.agent.request(options);
        req.setOption("Accept", "application/td+json");
        return new Promise((resolve, reject) => {
            req.on("response", (res) => {
                var _a;
                const contentType = (_a = res.headers["Content-Format"]) !== null && _a !== void 0 ? _a : "application/td+json";
                resolve(new core_1.Content(contentType, stream_1.Readable.from(res.payload)));
            });
            req.on("error", (err) => reject(err));
            req.end();
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.agent.close();
        });
    }
    uriToOptions(uri) {
        var _a, _b, _c, _d;
        const requestUri = url.parse(uri);
        const agentOptions = this.agentOptions;
        agentOptions.type = net.isIPv6((_a = requestUri.hostname) !== null && _a !== void 0 ? _a : "") ? "udp6" : "udp4";
        this.agent = new coap_2.Agent(agentOptions);
        const options = {
            agent: this.agent,
            hostname: (_b = requestUri.hostname) !== null && _b !== void 0 ? _b : "",
            port: requestUri.port != null ? parseInt(requestUri.port, 10) : 5683,
            pathname: (_c = requestUri.pathname) !== null && _c !== void 0 ? _c : "",
            query: (_d = requestUri.query) !== null && _d !== void 0 ? _d : "",
            observe: false,
            multicast: false,
            confirmable: true,
        };
        return options;
    }
    setBlockOption(req, optionName, blockSize) {
        if (blockSize == null) {
            return;
        }
        try {
            const block2OptionValue = (0, coap_1.blockSizeToOptionValue)(blockSize);
            req.setOption(optionName, block2OptionValue);
        }
        catch (error) {
            warn(`${error}`);
        }
    }
    getRequestParamsFromForm(form, defaultMethod, observe = false) {
        var _a, _b, _c;
        const method = (_a = form["cov:method"]) !== null && _a !== void 0 ? _a : defaultMethod;
        debug(`CoapClient got Form "method" ${method}`);
        const contentFormat = (_c = (_b = form["cov:contentFormat"]) !== null && _b !== void 0 ? _b : form.contentType) !== null && _c !== void 0 ? _c : "application/json";
        debug(`"CoapClient got Form 'contentType' ${contentFormat} `);
        const accept = form["cov:accept"];
        if (accept != null) {
            debug(`"CoapClient determined Form 'accept' ${accept} `);
        }
        return Object.assign(Object.assign({}, this.uriToOptions(form.href)), { method,
            observe,
            contentFormat,
            accept });
    }
    applyFormDataToRequest(form, req) {
        const blockwise = form["cov:blockwise"];
        if (blockwise != null) {
            this.setBlockOption(req, "Block2", blockwise["cov:block2Size"]);
            this.setBlockOption(req, "Block1", blockwise["cov:block1Size"]);
        }
    }
    generateRequest(form, defaultMethod, observable = false) {
        const requestParams = this.getRequestParamsFromForm(form, defaultMethod, observable);
        const req = this.agent.request(requestParams);
        this.applyFormDataToRequest(form, req);
        return req;
    }
}
exports.default = CoapClient;
//# sourceMappingURL=coap-client.js.map