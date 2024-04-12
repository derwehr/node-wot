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
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const Subscription_1 = require("rxjs/Subscription");
const core_1 = require("@node-wot/core");
const node_fetch_1 = __importStar(require("node-fetch"));
const buffer_1 = require("buffer");
const oauth_manager_1 = __importDefault(require("./oauth-manager"));
const credential_1 = require("./credential");
const subscription_protocols_1 = require("./subscription-protocols");
const { debug, warn, error } = (0, core_1.createLoggers)("binding-http", "http-client-impl");
class HttpClient {
    constructor(config = null, secure = false, oauthManager = new oauth_manager_1.default()) {
        this.proxyRequest = null;
        this.allowSelfSigned = false;
        this.credential = null;
        this.activeSubscriptions = new Map();
        if (config !== null && config.proxy && config.proxy.href) {
            this.proxyRequest = new node_fetch_1.Request(HttpClient.fixLocalhostName(config.proxy.href));
            if (config.proxy.scheme === "basic") {
                if (!Object.prototype.hasOwnProperty.call(config.proxy, "username") ||
                    !Object.prototype.hasOwnProperty.call(config.proxy, "password"))
                    warn("HttpClient client configured for basic proxy auth, but no username/password given");
                this.proxyRequest.headers.set("proxy-authorization", "Basic " + buffer_1.Buffer.from(config.proxy.username + ":" + config.proxy.password).toString("base64"));
            }
            else if (config.proxy.scheme === "bearer") {
                if (!Object.prototype.hasOwnProperty.call(config.proxy, "token"))
                    warn("HttpClient client configured for bearer proxy auth, but no token given");
                this.proxyRequest.headers.set("proxy-authorization", "Bearer " + config.proxy.token);
            }
            if (this.proxyRequest.protocol === "https") {
                secure = true;
            }
            debug(`HttpClient using ${secure ? "secure " : ""}proxy ${this.proxyRequest.hostname}:${this.proxyRequest.port}`);
        }
        if (config !== null && config.allowSelfSigned !== undefined) {
            this.allowSelfSigned = config.allowSelfSigned;
            warn(`HttpClient allowing self-signed/untrusted certificates -- USE FOR TESTING ONLY`);
        }
        this.agent = secure
            ? new https.Agent({
                rejectUnauthorized: !this.allowSelfSigned,
            })
            : new http.Agent();
        this.provider = secure ? "https" : "http";
        this.oauth = oauthManager;
    }
    toString() {
        return `[HttpClient]`;
    }
    readResource(form) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = yield this.generateFetchRequest(form, "GET");
            debug(`HttpClient (readResource) sending ${request.method} to ${request.url}`);
            const result = yield this.fetch(request);
            this.checkFetchResponse(result);
            debug(`HttpClient received headers: ${JSON.stringify(result.headers.raw())}`);
            debug(`HttpClient received Content-Type: ${result.headers.get("content-type")}`);
            const body = core_1.ProtocolHelpers.toNodeStream(result.body);
            return new core_1.Content((_a = result.headers.get("content-type")) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT, body);
        });
    }
    writeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = yield this.generateFetchRequest(form, "PUT", {
                headers: [["content-type", content.type]],
                body: content.body,
            });
            debug(`HttpClient (writeResource) sending ${request.method} with '${request.headers.get("Content-Type")}' to ${request.url}`);
            const result = yield this.fetch(request);
            debug(`HttpClient received ${result.status} from ${result.url}`);
            this.checkFetchResponse(result);
            debug(`HttpClient received headers: ${JSON.stringify(result.headers.raw())}`);
        });
    }
    subscribeResource(form, next, error, complete) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const defaultSubprotocol = "longpoll";
            const subprotocol = (_a = form.subprotocol) !== null && _a !== void 0 ? _a : defaultSubprotocol;
            let internalSubscription;
            if (subprotocol === defaultSubprotocol) {
                internalSubscription = new subscription_protocols_1.LongPollingSubscription(form, this);
            }
            else if (form.subprotocol === "sse") {
                internalSubscription = new subscription_protocols_1.SSESubscription(form);
            }
            else {
                throw new Error(`HttpClient does not support subprotocol ${form.subprotocol}`);
            }
            yield internalSubscription.open(next, error, complete);
            this.activeSubscriptions.set(form.href, internalSubscription);
            return new Subscription_1.Subscription(() => {
                internalSubscription.close();
            });
        });
    }
    invokeResource(form, content) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const headers = content != null ? [["content-type", content.type]] : [];
            const request = yield this.generateFetchRequest(form, "POST", {
                headers,
                body: content === null || content === void 0 ? void 0 : content.body,
            });
            debug(`HttpClient (invokeResource) sending ${request.method} ${content != null ? `with '"${request.headers.get("Content-Type")}"` : ""} to ${request.url}`);
            const result = yield this.fetch(request);
            debug(`HttpClient received ${result.status} from ${request.url}`);
            debug(`HttpClient received Content-Type: ${result.headers.get("content-type")}`);
            this.checkFetchResponse(result);
            const body = core_1.ProtocolHelpers.toNodeStream(result.body);
            return new core_1.Content((_a = result.headers.get("content-type")) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT, body);
        });
    }
    unlinkResource(form) {
        return __awaiter(this, void 0, void 0, function* () {
            debug(`HttpClient (unlinkResource) ${form.href}`);
            const internalSub = this.activeSubscriptions.get(form.href);
            if (internalSub) {
                internalSub.close();
            }
            else {
                warn(`HttpClient cannot unlink ${form.href} no subscription found`);
            }
        });
    }
    requestThingDescription(uri) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
                Accept: "application/td+json",
            };
            const response = yield (0, node_fetch_1.default)(uri, { headers });
            const body = core_1.ProtocolHelpers.toNodeStream(response.body);
            return new core_1.Content((_a = response.headers.get("content-type")) !== null && _a !== void 0 ? _a : "application/td+json", body);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    stop() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            (_b = (_a = this.agent) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
    }
    setSecurity(metadata, credentials) {
        if (metadata === undefined || !Array.isArray(metadata) || metadata.length === 0) {
            warn("HttpClient without security");
            return false;
        }
        const security = metadata[0];
        switch (security.scheme) {
            case "basic": {
                const securityBasic = security;
                this.credential = new credential_1.BasicCredential(credentials, securityBasic);
                break;
            }
            case "bearer": {
                const securityBearer = security;
                this.credential = new credential_1.BearerCredential(credentials, securityBearer);
                break;
            }
            case "apikey": {
                const securityAPIKey = security;
                this.credential = new credential_1.BasicKeyCredential(credentials, securityAPIKey);
                break;
            }
            case "oauth2": {
                const securityOAuth = security;
                if (securityOAuth.flow === "client") {
                    securityOAuth.flow = "client_credentials";
                    this.credential = this.oauth.handleClient(securityOAuth, credentials);
                }
                else if (securityOAuth.flow === "password") {
                    this.credential = this.oauth.handleResourceOwnerCredential(securityOAuth, credentials);
                }
                break;
            }
            case "TuyaCustomBearer": {
                this.credential = new credential_1.TuyaCustomBearer(credentials, security);
                break;
            }
            case "nosec":
                break;
            default:
                error(`HttpClient cannot set security scheme '${security.scheme}'. ${metadata}`);
                return false;
        }
        if (security.proxy != null) {
            if (this.proxyRequest !== null) {
                debug(`HttpClient overriding client-side proxy with security proxy '${security.proxy}`);
            }
            this.proxyRequest = new node_fetch_1.Request(HttpClient.fixLocalhostName(security.proxy));
            if (security.scheme === "basic") {
                const basicCredential = credentials;
                if (basicCredential === undefined ||
                    basicCredential.username === undefined ||
                    basicCredential.password === undefined) {
                    throw new Error(`No Basic credentials for Thing`);
                }
                this.proxyRequest.headers.set("proxy-authorization", "Basic " + buffer_1.Buffer.from(basicCredential.username + ":" + basicCredential.password).toString("base64"));
            }
            else if (security.scheme === "bearer") {
                const tokenCredentials = credentials;
                if (credentials === undefined || tokenCredentials.token === undefined) {
                    throw new Error(`No Bearer credentials for Thing`);
                }
                this.proxyRequest.headers.set("proxy-authorization", "Bearer " + tokenCredentials.token);
            }
        }
        debug(`HttpClient using security scheme '${security.scheme}'`);
        return true;
    }
    generateFetchRequest(form, defaultMethod, additionalOptions = {}) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const requestInit = additionalOptions;
            const url = HttpClient.fixLocalhostName(form.href);
            requestInit.method = form["htv:methodName"] ? form["htv:methodName"] : defaultMethod;
            requestInit.headers = (_a = requestInit.headers) !== null && _a !== void 0 ? _a : [];
            requestInit.headers = requestInit.headers;
            if (Array.isArray(form["htv:headers"])) {
                debug(`HttpClient got Form 'headers' ${form["htv:headers"]}`);
                const headers = form["htv:headers"];
                for (const option of headers) {
                    requestInit.headers.push([option["htv:fieldName"], option["htv:fieldValue"]]);
                }
            }
            else if (typeof form["htv:headers"] === "object") {
                debug(`HttpClient got Form SINGLE-ENTRY 'headers' ${form["htv:headers"]}`);
                const option = form["htv:headers"];
                requestInit.headers.push([option["htv:fieldName"], option["htv:fieldValue"]]);
            }
            requestInit.agent = this.agent;
            let request = this.proxyRequest ? new node_fetch_1.Request(this.proxyRequest, requestInit) : new node_fetch_1.Request(url, requestInit);
            if (this.credential) {
                request = yield this.credential.sign(request);
            }
            if (this.proxyRequest) {
                const parsedBaseURL = new URL(url);
                request.url = request.url + parsedBaseURL.pathname;
                debug(`HttpClient proxy request URL: ${request.url}`);
                request.headers.set("host", parsedBaseURL.hostname);
            }
            return request;
        });
    }
    fetch(request, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, node_fetch_1.default)(request, { body: content === null || content === void 0 ? void 0 : content.body });
            if (HttpClient.isOAuthTokenExpired(result, this.credential)) {
                this.credential = yield this.credential.refreshToken();
                return yield (0, node_fetch_1.default)(yield this.credential.sign(request));
            }
            return result;
        });
    }
    checkFetchResponse(response) {
        const statusCode = response.status;
        if (statusCode < 200) {
            throw new Error(`HttpClient received ${statusCode} and cannot continue (not implemented, open GitHub Issue)`);
        }
        else if (statusCode < 300) {
        }
        else if (statusCode < 400) {
            throw new Error(`HttpClient received ${statusCode} and cannot continue (not implemented, open GitHub Issue)`);
        }
        else if (statusCode < 500) {
            throw new Error(`Client error: ${response.statusText}`);
        }
        else {
            throw new Error(`Server error: ${response.statusText}`);
        }
    }
    static isOAuthTokenExpired(result, credential) {
        return result.status === 401 && credential instanceof credential_1.OAuthCredential;
    }
    static fixLocalhostName(url) {
        const localhostPresent = /^(https?:)?(\/\/)?(?:[^@\n]+@)?(www\.)?(localhost)/gm;
        if (localhostPresent.test(url)) {
            warn("LOCALHOST FIX");
            return url.replace(localhostPresent, "$1$2127.0.0.1");
        }
        return url;
    }
}
exports.default = HttpClient;
//# sourceMappingURL=http-client-impl.js.map