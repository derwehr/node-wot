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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSESubscription = exports.LongPollingSubscription = void 0;
const eventsource_1 = __importDefault(require("eventsource"));
const core_1 = require("@node-wot/core");
const stream_1 = require("stream");
const { debug } = (0, core_1.createLoggers)("binding-http", "subscription-protocols");
class LongPollingSubscription {
    constructor(form, client) {
        this.form = form;
        this.client = client;
        this.closed = false;
        this.abortController = new AbortController();
    }
    open(next, error, complete) {
        return new Promise((resolve, reject) => {
            const polling = (handshake) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    if (handshake) {
                        const headRequest = yield this.client["generateFetchRequest"](this.form, "HEAD", {
                            timeout: 1000,
                            signal: this.abortController.signal,
                        });
                        const result = yield this.client["fetch"](headRequest);
                        if (result.ok)
                            resolve();
                    }
                    const request = yield this.client["generateFetchRequest"](this.form, "GET", {
                        timeout: 60 * 60 * 1000,
                        signal: this.abortController.signal,
                    });
                    debug(`HttpClient (subscribeResource) sending ${request.method} to ${request.url}`);
                    const result = yield this.client["fetch"](request);
                    this.client["checkFetchResponse"](result);
                    debug(`HttpClient received ${result.status} from ${request.url}`);
                    debug(`HttpClient received headers: ${JSON.stringify(result.headers.raw())}`);
                    debug(`HttpClient received Content-Type: ${result.headers.get("content-type")}`);
                    if (!this.closed) {
                        const body = core_1.ProtocolHelpers.toNodeStream(result.body);
                        next(new core_1.Content((_a = result.headers.get("content-type")) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT, body));
                        polling(false);
                    }
                    complete && complete();
                }
                catch (e) {
                    const err = e instanceof Error ? e : new Error(JSON.stringify(e));
                    error && error(err);
                    complete && complete();
                    reject(e);
                }
            });
            polling(true);
        });
    }
    close() {
        this.abortController.abort();
        this.closed = true;
    }
}
exports.LongPollingSubscription = LongPollingSubscription;
class SSESubscription {
    constructor(form) {
        this.form = form;
        this.closed = false;
    }
    open(next, error, complete) {
        return new Promise((resolve, reject) => {
            this.eventSource = new eventsource_1.default(this.form.href);
            this.eventSource.onopen = (event) => {
                debug(`HttpClient (subscribeResource) Server-Sent Event connection is opened to ${this.form.href}`);
                resolve();
            };
            this.eventSource.onmessage = (event) => {
                var _a;
                debug(`HttpClient received ${JSON.stringify(event)} from ${this.form.href}`);
                const output = new core_1.Content((_a = this.form.contentType) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT, stream_1.Readable.from(JSON.stringify(event)));
                next(output);
            };
            this.eventSource.onerror = function (event) {
                error === null || error === void 0 ? void 0 : error(new Error(event.toString()));
                complete && complete();
                reject(event.toString());
            };
        });
    }
    close() {
        var _a;
        (_a = this.eventSource) === null || _a === void 0 ? void 0 : _a.close();
    }
}
exports.SSESubscription = SSESubscription;
//# sourceMappingURL=subscription-protocols.js.map