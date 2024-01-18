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
const core_1 = require("@node-wot/core");
const mqtt = __importStar(require("mqtt"));
const { debug, warn } = (0, core_1.createLoggers)("binding-mqtt", "mqtt-message-pool");
class MQTTMessagePool {
    constructor() {
        this.subscribers = new Map();
        this.errors = new Map();
    }
    connect(brokerURI, config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client === undefined) {
                this.client = yield mqtt.connectAsync(brokerURI, config);
                this.client.on("message", (receivedTopic, payload) => {
                    var _a;
                    debug(`Received MQTT message from ${brokerURI} (topic: ${receivedTopic}, data length: ${payload.length})`);
                    (_a = this.subscribers.get(receivedTopic)) === null || _a === void 0 ? void 0 : _a(receivedTopic, payload);
                });
                this.client.on("error", (error) => {
                    warn(`MQTT client error: ${error.message}`);
                    this.errors.forEach((errorCallback) => {
                        errorCallback(error);
                    });
                });
            }
        });
    }
    subscribe(filter, callback, error) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client == null) {
                throw new Error("MQTT client is not connected");
            }
            const filters = Array.isArray(filter) ? filter : [filter];
            filters.forEach((f) => {
                if (this.subscribers.has(f)) {
                    warn(`Already subscribed to ${f}; we are not supporting multiple subscribers to the same topic`);
                    warn(`The subscription will be ignored`);
                    return;
                }
                this.subscribers.set(f, callback);
                this.errors.set(f, error);
            });
            yield this.client.subscribeAsync(filters);
        });
    }
    unsubscribe(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client == null) {
                throw new Error("MQTT client is not connected");
            }
            const filters = Array.isArray(filter) ? filter : [filter];
            filters.forEach((f) => {
                this.subscribers.delete(f);
                this.errors.delete(f);
            });
            yield this.client.unsubscribeAsync(filters);
        });
    }
    publish(topic, message, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client == null) {
                throw new Error("MQTT client is not connected");
            }
            debug(`Publishing MQTT message to ${topic} (data length: ${message.length})`);
            yield this.client.publishAsync(topic, message, options);
        });
    }
    end() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            for (const filter of this.subscribers.keys()) {
                this.unsubscribe(filter);
            }
            return (_a = this.client) === null || _a === void 0 ? void 0 : _a.endAsync();
        });
    }
}
exports.default = MQTTMessagePool;
//# sourceMappingURL=mqtt-message-pool.js.map