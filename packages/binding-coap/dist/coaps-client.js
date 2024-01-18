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
const Subscription_1 = require("rxjs/Subscription");
const core_1 = require("@node-wot/core");
const coap_1 = require("./coap");
const node_coap_client_1 = require("node-coap-client");
const stream_1 = require("stream");
const { debug, warn, error } = (0, core_1.createLoggers)("binding-coap", "coaps-client");
class CoapsClient {
    toString() {
        return "[CoapsClient]";
    }
    readResource(form) {
        return new Promise((resolve, reject) => {
            this.generateRequest(form, "GET")
                .then((res) => {
                var _a, _b;
                debug(`CoapsClient received ${res.code} from ${form.href}`);
                const contentType = (_a = form.contentType) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT;
                const body = stream_1.Readable.from((_b = res.payload) !== null && _b !== void 0 ? _b : Buffer.alloc(0));
                resolve(new core_1.Content(contentType, body));
            })
                .catch((err) => {
                reject(err);
            });
        });
    }
    writeResource(form, content) {
        return new Promise((resolve, reject) => {
            this.generateRequest(form, "PUT", content)
                .then((res) => {
                debug(`CoapsClient received ${res.code} from ${form.href}`);
                resolve();
            })
                .catch((err) => {
                reject(err);
            });
        });
    }
    invokeResource(form, content) {
        return new Promise((resolve, reject) => {
            this.generateRequest(form, "POST", content)
                .then((res) => {
                var _a, _b;
                debug(`CoapsClient received ${res.code} from ${form.href}`);
                const contentType = (_a = form.contentType) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT;
                const body = stream_1.Readable.from((_b = res.payload) !== null && _b !== void 0 ? _b : Buffer.alloc(0));
                resolve(new core_1.Content(contentType, body));
            })
                .catch((err) => {
                reject(err);
            });
        });
    }
    unlinkResource(form) {
        return new Promise((resolve, reject) => {
            this.generateRequest(form, "DELETE")
                .then((res) => {
                debug(`CoapsClient received ${res.code} from ${form.href}`);
                debug(`CoapsClient received headers: ${JSON.stringify(res.format)}`);
                resolve();
            })
                .catch((err) => {
                reject(err);
            });
        });
    }
    subscribeResource(form, next, error, complete) {
        return new Promise((resolve, reject) => {
            const requestUri = new URL(form.href.replace(/$coaps/, "https"));
            if (this.authorization != null) {
                node_coap_client_1.CoapClient.setSecurityParams(requestUri.hostname, this.authorization);
            }
            const callback = (resp) => {
                var _a;
                if (resp.payload != null) {
                    next(new core_1.Content((_a = form === null || form === void 0 ? void 0 : form.contentType) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT, stream_1.Readable.from(resp.payload)));
                }
            };
            node_coap_client_1.CoapClient
                .observe(form.href, "get", callback)
                .then(() => {
                resolve(new Subscription_1.Subscription(() => {
                    node_coap_client_1.CoapClient.stopObserving(form.href);
                    complete === null || complete === void 0 ? void 0 : complete();
                }));
            })
                .catch((err) => {
                error === null || error === void 0 ? void 0 : error(err);
                reject(err);
            });
        });
    }
    requestThingDescription(uri) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield node_coap_client_1.CoapClient.request(uri, "get", undefined, {});
            const contentType = "application/td+json";
            const payload = (_a = response.payload) !== null && _a !== void 0 ? _a : Buffer.alloc(0);
            return new core_1.Content(contentType, stream_1.Readable.from(payload));
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
            warn(`CoapsClient received empty security metadata`);
            return false;
        }
        const security = metadata[0];
        if (security.scheme === "psk" && credentials != null) {
            this.authorization = { psk: {} };
            this.authorization.psk[credentials.identity] = credentials.psk;
        }
        else if (security.scheme === "apikey") {
            error(`CoapsClient cannot use Apikey: Not implemented`);
            return false;
        }
        else {
            error(`CoapsClient cannot set security scheme '${security.scheme}'`);
            error(`${metadata}`);
            return false;
        }
        debug(`CoapsClient using security scheme '${security.scheme}'`);
        return true;
    }
    determineRequestMethod(formMethod, defaultMethod) {
        if ((0, coap_1.isSupportedCoapMethod)(formMethod)) {
            return formMethod;
        }
        else if ((0, coap_1.isValidCoapMethod)(formMethod)) {
            debug(`Method ${formMethod} is not supported yet.`, `Using default method ${defaultMethod} instead.`);
        }
        else {
            debug(`Unknown method ${formMethod} found.`, `Using default method ${defaultMethod} instead.`);
        }
        return defaultMethod;
    }
    generateRequest(form, defaultMethod, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestUri = new URL(form.href.replace(/$coaps/, "https"));
            if (this.authorization != null) {
                node_coap_client_1.CoapClient.setSecurityParams(requestUri.hostname, this.authorization);
            }
            let method;
            if (form["cov:method"] != null) {
                const formMethodName = form["cov:method"];
                debug(`CoapClient got Form "methodName" ${formMethodName}`);
                method = this.determineRequestMethod(formMethodName, defaultMethod);
            }
            else {
                method = defaultMethod;
            }
            debug(`CoapsClient sending ${method} to ${form.href}`);
            const body = yield (content === null || content === void 0 ? void 0 : content.toBuffer());
            const req = node_coap_client_1.CoapClient.request(form.href, method.toLowerCase(), body);
            return req;
        });
    }
}
exports.default = CoapsClient;
//# sourceMappingURL=coaps-client.js.map