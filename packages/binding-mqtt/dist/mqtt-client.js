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
const url = __importStar(require("url"));
const Subscription_1 = require("rxjs/Subscription");
const stream_1 = require("stream");
const mqtt_message_pool_1 = __importDefault(require("./mqtt-message-pool"));
const util_1 = require("./util");
const { debug, warn } = (0, core_1.createLoggers)("binding-mqtt", "mqtt-client");
class MqttClient {
    constructor(config = {}, secure = false) {
        this.config = config;
        this.pools = new Map();
        this.scheme = "mqtt" + (secure ? "s" : "");
    }
    subscribeResource(form, next, error, complete) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const contentType = (_a = form.contentType) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT;
            const requestUri = new url.URL(form.href);
            const brokerUri = `${this.scheme}://` + requestUri.host;
            const filter = (_b = requestUri.pathname.slice(1)) !== null && _b !== void 0 ? _b : form["mqv:filter"];
            let pool = this.pools.get(brokerUri);
            if (pool == null) {
                pool = new mqtt_message_pool_1.default();
                this.pools.set(brokerUri, pool);
            }
            yield pool.connect(brokerUri, this.config);
            pool.subscribe(filter, (topic, message) => {
                next(new core_1.Content(contentType, stream_1.Readable.from(message)));
            }, (e) => {
                if (error)
                    error(e);
            });
            return new Subscription_1.Subscription(() => { });
        });
    }
    readResource(form) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const contentType = (_a = form.contentType) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT;
            const requestUri = new url.URL(form.href);
            const brokerUri = `${this.scheme}://` + requestUri.host;
            const filter = (_b = requestUri.pathname.slice(1)) !== null && _b !== void 0 ? _b : form["mqv:filter"];
            let pool = this.pools.get(brokerUri);
            if (pool == null) {
                pool = new mqtt_message_pool_1.default();
                this.pools.set(brokerUri, pool);
            }
            yield pool.connect(brokerUri, this.config);
            const result = yield new Promise((resolve, reject) => {
                pool.subscribe(filter, (topic, message) => {
                    resolve(new core_1.Content(contentType, stream_1.Readable.from(message)));
                }, (e) => {
                    reject(e);
                });
            });
            yield pool.unsubscribe(filter);
            return result;
        });
    }
    writeResource(form, content) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const requestUri = new url.URL(form.href);
            const brokerUri = `${this.scheme}://${requestUri.host}`;
            const topic = (_a = requestUri.pathname.slice(1)) !== null && _a !== void 0 ? _a : form["mqv:topic"];
            let pool = this.pools.get(brokerUri);
            if (pool == null) {
                pool = new mqtt_message_pool_1.default();
                this.pools.set(brokerUri, pool);
            }
            yield pool.connect(brokerUri, this.config);
            const buffer = content === undefined ? Buffer.from("") : yield content.toBuffer();
            yield pool.publish(topic, buffer, {
                retain: form["mqv:retain"],
                qos: (0, util_1.mapQoS)(form["mqv:qos"]),
            });
        });
    }
    invokeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestUri = new url.URL(form.href);
            const topic = requestUri.pathname.slice(1);
            const brokerUri = `${this.scheme}://${requestUri.host}`;
            let pool = this.pools.get(brokerUri);
            if (pool == null) {
                pool = new mqtt_message_pool_1.default();
                this.pools.set(brokerUri, pool);
            }
            yield pool.connect(brokerUri, this.config);
            const buffer = content === undefined ? Buffer.from("") : yield content.toBuffer();
            yield pool.publish(topic, buffer, {
                retain: form["mqv:retain"],
                qos: (0, util_1.mapQoS)(form["mqv:qos"]),
            });
            return new core_1.DefaultContent(stream_1.Readable.from([]));
        });
    }
    unlinkResource(form) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestUri = new url.URL(form.href);
            const brokerUri = `${this.scheme}://` + requestUri.host;
            const topic = requestUri.pathname.slice(1);
            const pool = this.pools.get(brokerUri);
            if (pool != null) {
                yield pool.unsubscribe(topic);
                debug(`MqttClient unsubscribed from topic '${topic}'`);
            }
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
            for (const pool of this.pools.values()) {
                yield pool.end();
            }
            if (this.client)
                return this.client.endAsync();
        });
    }
    setSecurity(metadata, credentials) {
        if (metadata === undefined || !Array.isArray(metadata) || metadata.length === 0) {
            warn(`MqttClient received empty security metadata`);
            return false;
        }
        const security = metadata[0];
        if (security.scheme === "basic") {
            if (credentials === undefined) {
                throw new Error("binding-mqtt: security wants to be basic but you have provided no credentials");
            }
            else {
                this.config.username = credentials.username;
                this.config.password = credentials.password;
            }
        }
        return true;
    }
}
exports.default = MqttClient;
//# sourceMappingURL=mqtt-client.js.map