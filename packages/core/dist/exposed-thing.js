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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ExposedThing_propertyHandlers, _ExposedThing_actionHandlers, _ExposedThing_eventHandlers, _ExposedThing_propertyListeners, _ExposedThing_eventListeners, _ExposedThing_servient;
Object.defineProperty(exports, "__esModule", { value: true });
const TD = __importStar(require("@node-wot/td-tools"));
const helpers_1 = __importDefault(require("./helpers"));
const interaction_output_1 = require("./interaction-output");
const stream_1 = require("stream");
const protocol_helpers_1 = __importDefault(require("./protocol-helpers"));
const es2018_1 = require("web-streams-polyfill/ponyfill/es2018");
const core_1 = require("./core");
const content_serdes_1 = __importDefault(require("./content-serdes"));
const protocol_listener_registry_1 = __importDefault(require("./protocol-listener-registry"));
const logger_1 = require("./logger");
const { debug } = (0, logger_1.createLoggers)("core", "exposed-thing");
class ExposedThing extends TD.Thing {
    constructor(servient, thingModel = {}) {
        var _a, _b;
        super();
        _ExposedThing_propertyHandlers.set(this, new Map());
        _ExposedThing_actionHandlers.set(this, new Map());
        _ExposedThing_eventHandlers.set(this, new Map());
        _ExposedThing_propertyListeners.set(this, new protocol_listener_registry_1.default());
        _ExposedThing_eventListeners.set(this, new protocol_listener_registry_1.default());
        _ExposedThing_servient.set(this, void 0);
        __classPrivateFieldSet(this, _ExposedThing_servient, servient, "f");
        this.id = (_a = thingModel.id) !== null && _a !== void 0 ? _a : "";
        this.title = (_b = thingModel.title) !== null && _b !== void 0 ? _b : "";
        this.security = "";
        this.securityDefinitions = {};
        this.properties = {};
        this.actions = {};
        this.events = {};
        const deepClonedModel = JSON.parse(JSON.stringify(thingModel));
        Object.assign(this, deepClonedModel);
        TD.setContextLanguage(this, TD.DEFAULT_CONTEXT_LANGUAGE, false);
    }
    getThingDescription() {
        return JSON.parse(TD.serializeTD(this));
    }
    emitEvent(name, data) {
        if (this.events[name] != null) {
            const eventAffordance = this.events[name];
            __classPrivateFieldGet(this, _ExposedThing_eventListeners, "f").notify(eventAffordance, data, eventAffordance.data);
        }
        else {
            throw new Error("NotFoundError for event '" + name + "'");
        }
    }
    emitPropertyChange(name) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.properties[name] != null) {
                const property = this.properties[name];
                const readHandler = (_a = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(name)) === null || _a === void 0 ? void 0 : _a.readHandler;
                if (!readHandler) {
                    throw new Error("Can't read property readHandler is not defined. Did you forget to register a readHandler?");
                }
                const data = yield readHandler();
                __classPrivateFieldGet(this, _ExposedThing_propertyListeners, "f").notify(property, data, property);
            }
            else {
                throw new Error("NotFoundError for property '" + name + "'");
            }
        });
    }
    expose() {
        debug(`ExposedThing '${this.title}' exposing all Interactions and TD`);
        return new Promise((resolve, reject) => {
            __classPrivateFieldGet(this, _ExposedThing_servient, "f")
                .expose(this)
                .then(() => {
                resolve();
            })
                .catch((err) => reject(err));
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            debug(`ExposedThing '${this.title}' destroying the thing and its interactions`);
            yield __classPrivateFieldGet(this, _ExposedThing_servient, "f").destroyThing(this.id);
            __classPrivateFieldGet(this, _ExposedThing_eventListeners, "f").unregisterAll();
            __classPrivateFieldGet(this, _ExposedThing_propertyListeners, "f").unregisterAll();
            __classPrivateFieldGet(this, _ExposedThing_eventHandlers, "f").clear();
            __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").clear();
            __classPrivateFieldGet(this, _ExposedThing_eventHandlers, "f").clear();
        });
    }
    setPropertyReadHandler(propertyName, handler) {
        debug(`ExposedThing '${this.title}' setting read handler for '${propertyName}'`);
        if (this.properties[propertyName] != null) {
            if (this.properties[propertyName].writeOnly === true) {
                throw new Error(`ExposedThing '${this.title}' cannot set read handler for property '${propertyName}' due to writeOnly flag`);
            }
            else {
                let propertyHandler = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(propertyName);
                if (propertyHandler) {
                    propertyHandler.readHandler = handler;
                }
                else {
                    propertyHandler = { readHandler: handler };
                }
                __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").set(propertyName, propertyHandler);
            }
        }
        else {
            throw new Error(`ExposedThing '${this.title}' has no Property '${propertyName}'`);
        }
        return this;
    }
    setPropertyWriteHandler(propertyName, handler) {
        debug(`ExposedThing '${this.title}' setting write handler for '${propertyName}'`);
        if (this.properties[propertyName] != null) {
            if (this.properties[propertyName].readOnly === true) {
                throw new Error(`ExposedThing '${this.title}' cannot set write handler for property '${propertyName}' due to readOnly flag`);
            }
            else {
                let propertyHandler = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(propertyName);
                if (propertyHandler) {
                    propertyHandler.writeHandler = handler;
                }
                else {
                    propertyHandler = { writeHandler: handler };
                }
                __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").set(propertyName, propertyHandler);
            }
        }
        else {
            throw new Error(`ExposedThing '${this.title}' has no Property '${propertyName}'`);
        }
        return this;
    }
    setPropertyObserveHandler(name, handler) {
        debug(`ExposedThing '${this.title}' setting property observe handler for '${name}'`);
        if (this.properties[name] != null) {
            if (this.properties[name].observable !== true) {
                throw new Error(`ExposedThing '${this.title}' cannot set observe handler for property '${name}' since the observable flag is set to false`);
            }
            else {
                let propertyHandler = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(name);
                if (propertyHandler) {
                    propertyHandler.observeHandler = handler;
                }
                else {
                    propertyHandler = { observeHandler: handler };
                }
                __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").set(name, propertyHandler);
            }
        }
        else {
            throw new Error(`ExposedThing '${this.title}' has no Property '${name}'`);
        }
        return this;
    }
    setPropertyUnobserveHandler(name, handler) {
        debug(`ExposedThing '${this.title}' setting property unobserve handler for '${name}'`);
        if (this.properties[name] != null) {
            if (this.properties[name].observable !== true) {
                throw new Error(`ExposedThing '${this.title}' cannot set unobserve handler for property '${name}' due to missing observable flag`);
            }
            else {
                let propertyHandler = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(name);
                if (propertyHandler) {
                    propertyHandler.unobserveHandler = handler;
                }
                else {
                    propertyHandler = { unobserveHandler: handler };
                }
                __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").set(name, propertyHandler);
            }
        }
        else {
            throw new Error(`ExposedThing '${this.title}' has no Property '${name}'`);
        }
        return this;
    }
    setActionHandler(actionName, handler) {
        debug(`ExposedThing '${this.title}' setting action handler for '${actionName}'`);
        if (this.actions[actionName] != null) {
            __classPrivateFieldGet(this, _ExposedThing_actionHandlers, "f").set(actionName, handler);
        }
        else {
            throw new Error(`ExposedThing '${this.title}' has no Action '${actionName}'`);
        }
        return this;
    }
    setEventSubscribeHandler(name, handler) {
        debug(`ExposedThing '${this.title}' setting event subscribe handler for '${name}'`);
        if (this.events[name] != null) {
            let eventHandler = __classPrivateFieldGet(this, _ExposedThing_eventHandlers, "f").get(name);
            if (eventHandler) {
                eventHandler.subscribe = handler;
            }
            else {
                eventHandler = { subscribe: handler };
            }
            __classPrivateFieldGet(this, _ExposedThing_eventHandlers, "f").set(name, eventHandler);
        }
        else {
            throw new Error(`ExposedThing '${this.title}' has no Event '${name}'`);
        }
        return this;
    }
    setEventUnsubscribeHandler(name, handler) {
        debug(`ExposedThing '${this.title}' setting event unsubscribe handler for '${name}'`);
        if (this.events[name] != null) {
            let eventHandler = __classPrivateFieldGet(this, _ExposedThing_eventHandlers, "f").get(name);
            if (eventHandler) {
                eventHandler.unsubscribe = handler;
            }
            else {
                eventHandler = { unsubscribe: handler };
            }
            __classPrivateFieldGet(this, _ExposedThing_eventHandlers, "f").set(name, eventHandler);
        }
        else {
            throw new Error(`ExposedThing '${this.title}' has no Event '${name}'`);
        }
        return this;
    }
    handleInvokeAction(name, inputContent, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.actions[name] != null) {
                debug(`ExposedThing '${this.title}' has Action state of '${name}'`);
                const handler = __classPrivateFieldGet(this, _ExposedThing_actionHandlers, "f").get(name);
                if (handler != null) {
                    debug(`ExposedThing '${this.title}' calls registered handler for Action '${name}'`);
                    helpers_1.default.validateInteractionOptions(this, this.actions[name], options);
                    const form = (_a = this.actions[name].forms[options.formIndex]) !== null && _a !== void 0 ? _a : { contentType: "application/json" };
                    const result = yield handler(new interaction_output_1.InteractionOutput(inputContent, form, this.actions[name].input), options);
                    if (result !== undefined) {
                        return content_serdes_1.default.valueToContent(result, this.actions[name].output, form.contentType);
                    }
                }
                else {
                    throw new Error(`ExposedThing '${this.title}' has no handler for Action '${name}'`);
                }
            }
            else {
                throw new Error(`ExposedThing '${this.title}', no action found for '${name}'`);
            }
        });
    }
    handleReadProperty(propertyName, options) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.properties[propertyName] != null) {
                debug(`ExposedThing '${this.title}' has Action state of '${propertyName}'`);
                const readHandler = (_a = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(propertyName)) === null || _a === void 0 ? void 0 : _a.readHandler;
                if (readHandler != null) {
                    debug(`ExposedThing '${this.title}' calls registered readHandler for Property '${propertyName}'`);
                    helpers_1.default.validateInteractionOptions(this, this.properties[propertyName], options);
                    const result = yield readHandler(options);
                    const form = (_c = (_b = this.properties[propertyName]) === null || _b === void 0 ? void 0 : _b.forms[options.formIndex]) !== null && _c !== void 0 ? _c : {
                        contentType: "application/json",
                    };
                    return content_serdes_1.default.valueToContent(result, this.properties[propertyName], (_d = form === null || form === void 0 ? void 0 : form.contentType) !== null && _d !== void 0 ? _d : "application/json");
                }
                else {
                    throw new Error(`ExposedThing '${this.title}' has no readHandler for Property '${propertyName}'`);
                }
            }
            else {
                throw new Error(`ExposedThing '${this.title}', no property found for '${propertyName}'`);
            }
        });
    }
    _handleReadProperties(propertyNames, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const output = new Map();
                for (const propertyName of propertyNames) {
                    const form = this.properties[propertyName].forms.find((form) => form.contentType === core_1.ContentSerdes.DEFAULT || form.contentType == null);
                    if (!form) {
                        continue;
                    }
                    const contentResponse = yield this.handleReadProperty(propertyName, options);
                    output.set(propertyName, contentResponse);
                }
                return output;
            }
            catch (error) {
                throw new Error(`ConsumedThing '${this.title}', failed to read properties: ${propertyNames}.\n Error: ${error}`);
            }
        });
    }
    handleReadAllProperties(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const propertyNames = [];
            for (const propertyName in this.properties) {
                propertyNames.push(propertyName);
            }
            return yield this._handleReadProperties(propertyNames, options);
        });
    }
    handleReadMultipleProperties(propertyNames, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._handleReadProperties(propertyNames, options);
        });
    }
    handleWriteProperty(propertyName, inputContent, options) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.properties[propertyName] != null) {
                if (this.properties[propertyName].readOnly === true) {
                    throw new Error(`ExposedThing '${this.title}', property '${propertyName}' is readOnly`);
                }
                helpers_1.default.validateInteractionOptions(this, this.properties[propertyName], options);
                const writeHandler = (_a = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(propertyName)) === null || _a === void 0 ? void 0 : _a.writeHandler;
                const form = (_c = (_b = this.properties[propertyName]) === null || _b === void 0 ? void 0 : _b.forms[options.formIndex]) !== null && _c !== void 0 ? _c : {};
                if (writeHandler != null) {
                    yield writeHandler(new interaction_output_1.InteractionOutput(inputContent, form, this.properties[propertyName]), options);
                }
                else {
                    throw new Error(`ExposedThing '${this.title}' has no writeHandler for Property '${propertyName}'`);
                }
            }
            else {
                throw new Error(`ExposedThing '${this.title}', no property found for '${propertyName}'`);
            }
        });
    }
    handleWriteMultipleProperties(valueMap, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (const propertyName in valueMap) {
                const form = this.properties[propertyName].forms.find((form) => form.contentType === "application/json" || form.contentType == null);
                if (!form) {
                    continue;
                }
                promises.push(this.handleWriteProperty(propertyName, valueMap.get(propertyName), options));
            }
            try {
                yield Promise.all(promises);
            }
            catch (error) {
                throw new Error(`ExposedThing '${this.title}', failed to write multiple properties. ${error.message}`);
            }
        });
    }
    handleSubscribeEvent(name, listener, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.events[name] != null) {
                helpers_1.default.validateInteractionOptions(this, this.events[name], options);
                const formIndex = protocol_helpers_1.default.getFormIndexForOperation(this.events[name], "event", "subscribeevent", options.formIndex);
                if (formIndex !== -1) {
                    __classPrivateFieldGet(this, _ExposedThing_eventListeners, "f").register(this.events[name], formIndex, listener);
                    debug(`ExposedThing '${this.title}' subscribes to event '${name}'`);
                }
                else {
                    throw new Error(`ExposedThing '${this.title}', no property listener from found for '${name}' with form index '${options.formIndex}'`);
                }
                const subscribe = (_a = __classPrivateFieldGet(this, _ExposedThing_eventHandlers, "f").get(name)) === null || _a === void 0 ? void 0 : _a.subscribe;
                if (subscribe) {
                    yield subscribe(options);
                }
                debug(`ExposedThing '${this.title}' subscribes to event '${name}'`);
            }
            else {
                throw new Error(`ExposedThing '${this.title}', no event found for '${name}'`);
            }
        });
    }
    handleUnsubscribeEvent(name, listener, options) {
        var _a;
        if (this.events[name] != null) {
            helpers_1.default.validateInteractionOptions(this, this.events[name], options);
            const formIndex = protocol_helpers_1.default.getFormIndexForOperation(this.events[name], "event", "unsubscribeevent", options.formIndex);
            if (formIndex !== -1) {
                __classPrivateFieldGet(this, _ExposedThing_eventListeners, "f").unregister(this.events[name], formIndex, listener);
            }
            else {
                throw new Error(`ExposedThing '${this.title}', no event listener from found for '${name}' with form index '${options.formIndex}'`);
            }
            const unsubscribe = (_a = __classPrivateFieldGet(this, _ExposedThing_eventHandlers, "f").get(name)) === null || _a === void 0 ? void 0 : _a.unsubscribe;
            if (unsubscribe) {
                unsubscribe(options);
            }
            debug(`ExposedThing '${this.title}' unsubscribes from event '${name}'`);
        }
        else {
            throw new Error(`ExposedThing '${this.title}', no event found for '${name}'`);
        }
    }
    handleObserveProperty(name, listener, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.properties[name] != null) {
                helpers_1.default.validateInteractionOptions(this, this.properties[name], options);
                const formIndex = protocol_helpers_1.default.getFormIndexForOperation(this.properties[name], "property", "observeproperty", options.formIndex);
                if (formIndex !== -1) {
                    __classPrivateFieldGet(this, _ExposedThing_propertyListeners, "f").register(this.properties[name], formIndex, listener);
                    debug(`ExposedThing '${this.title}' subscribes to property '${name}'`);
                }
                else {
                    throw new Error(`ExposedThing '${this.title}', no property listener from found for '${name}' with form index '${options.formIndex}'`);
                }
                const observeHandler = (_a = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(name)) === null || _a === void 0 ? void 0 : _a.observeHandler;
                if (observeHandler) {
                    yield observeHandler(options);
                }
            }
            else {
                throw new Error(`ExposedThing '${this.title}', no property found for '${name}'`);
            }
        });
    }
    handleUnobserveProperty(name, listener, options) {
        var _a;
        if (this.properties[name] != null) {
            helpers_1.default.validateInteractionOptions(this, this.properties[name], options);
            const formIndex = protocol_helpers_1.default.getFormIndexForOperation(this.properties[name], "property", "unobserveproperty", options.formIndex);
            if (formIndex !== -1) {
                __classPrivateFieldGet(this, _ExposedThing_propertyListeners, "f").unregister(this.properties[name], formIndex, listener);
            }
            else {
                throw new Error(`ExposedThing '${this.title}', no property listener from found for '${name}' with form index '${options.formIndex}'`);
            }
            const unobserveHandler = (_a = __classPrivateFieldGet(this, _ExposedThing_propertyHandlers, "f").get(name)) === null || _a === void 0 ? void 0 : _a.unobserveHandler;
            if (unobserveHandler) {
                unobserveHandler(options);
            }
        }
        else {
            throw new Error(`ExposedThing '${this.title}', no property found for '${name}'`);
        }
    }
    static interactionInputToReadable(input) {
        let body;
        if (typeof ReadableStream !== "undefined" && input instanceof ReadableStream) {
            body = protocol_helpers_1.default.toNodeStream(input);
        }
        else if (input instanceof es2018_1.ReadableStream) {
            body = protocol_helpers_1.default.toNodeStream(input);
        }
        else if (Array.isArray(input) || typeof input === "object") {
            body = stream_1.Readable.from(Buffer.from(JSON.stringify(input), "utf-8"));
        }
        else {
            body = stream_1.Readable.from(Buffer.from(input.toString(), "utf-8"));
        }
        return body;
    }
}
exports.default = ExposedThing;
_ExposedThing_propertyHandlers = new WeakMap(), _ExposedThing_actionHandlers = new WeakMap(), _ExposedThing_eventHandlers = new WeakMap(), _ExposedThing_propertyListeners = new WeakMap(), _ExposedThing_eventListeners = new WeakMap(), _ExposedThing_servient = new WeakMap();
//# sourceMappingURL=exposed-thing.js.map