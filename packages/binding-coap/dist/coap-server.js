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
const TD = __importStar(require("@node-wot/td-tools"));
const core_1 = require("@node-wot/core");
const coap_1 = require("coap");
const slugify_1 = __importDefault(require("slugify"));
const stream_1 = require("stream");
const mdns_introducer_1 = require("./mdns-introducer");
const util_1 = require("./util");
const { debug, warn, info, error } = (0, core_1.createLoggers)("binding-coap", "coap-server");
const thingDescriptionParameters = new Map(Object.entries({
    rt: ["wot.thing"],
    ct: [50, 432],
}));
class CoapServer {
    constructor(config) {
        var _a;
        this.scheme = "coap";
        this.PROPERTY_DIR = "properties";
        this.ACTION_DIR = "actions";
        this.EVENT_DIR = "events";
        this.server = (0, coap_1.createServer)({ reuseAddr: false }, (req, res) => {
            this.handleRequest(req, res);
        });
        this.things = new Map();
        this.coreResources = new Map();
        this.port = (_a = config === null || config === void 0 ? void 0 : config.port) !== null && _a !== void 0 ? _a : 5683;
        this.address = config === null || config === void 0 ? void 0 : config.address;
        (0, coap_1.registerFormat)(core_1.ContentSerdes.JSON_LD, 2100);
    }
    start(servient) {
        info(`CoapServer starting on ${this.address !== undefined ? this.address + " " : ""}port ${this.port}`);
        return new Promise((resolve, reject) => {
            this.server.once("error", (err) => {
                reject(err);
            });
            this.server.listen(this.port, this.address, () => {
                this.server.on("error", (err) => {
                    error(`CoapServer for port ${this.port} failed: ${err.message}`);
                });
                this.mdnsIntroducer = new mdns_introducer_1.MdnsIntroducer(this.address);
                resolve();
            });
        });
    }
    closeServer() {
        return new Promise((resolve, reject) => {
            this.server.once("error", (err) => {
                reject(err);
            });
            this.server.close(() => {
                resolve();
            });
        });
    }
    stop() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            info(`CoapServer stopping on port ${this.getPort()}`);
            yield this.closeServer();
            yield ((_a = this.mdnsIntroducer) === null || _a === void 0 ? void 0 : _a.close());
        });
    }
    getSocket() {
        return this.server._sock;
    }
    getPort() {
        if (this.server._sock) {
            const socket = this.server._sock;
            return socket.address().port;
        }
        else {
            return -1;
        }
    }
    expose(thing, tdTemplate) {
        return __awaiter(this, void 0, void 0, function* () {
            const port = this.getPort();
            const urlPath = this.createThingUrlPath(thing);
            if (port === -1) {
                warn("CoapServer is assigned an invalid port, aborting expose process.");
                return;
            }
            this.fillInBindingData(thing, port, urlPath);
            debug(`CoapServer on port ${port} exposes '${thing.title}' as unique '/${urlPath}'`);
            this.setUpIntroductionMethods(thing, urlPath, port);
        });
    }
    createThingUrlPath(thing) {
        const urlPath = (0, slugify_1.default)(thing.title, { lower: true });
        if (this.things.has(urlPath)) {
            return core_1.Helpers.generateUniqueName(urlPath);
        }
        return urlPath;
    }
    fillInBindingData(thing, port, urlPath) {
        const addresses = core_1.Helpers.getAddresses();
        const offeredMediaTypes = core_1.ContentSerdes.get().getOfferedMediaTypes();
        for (const address of addresses) {
            for (const offeredMediaType of offeredMediaTypes) {
                const base = this.createThingBase(address, port, urlPath);
                this.fillInMetaPropertiesBindingData(thing, base, offeredMediaType);
                this.fillInPropertyBindingData(thing, base, offeredMediaType);
                this.fillInActionBindingData(thing, base, offeredMediaType);
                this.fillInEventBindingData(thing, base, offeredMediaType);
            }
        }
    }
    createThingBase(address, port, urlPath) {
        return `${this.scheme}://${address}:${port}/${encodeURIComponent(urlPath)}`;
    }
    fillInMetaPropertiesBindingData(thing, base, offeredMediaType) {
        const opValues = this.createPropertyMetaOpValues(thing);
        if (opValues.length === 0) {
            return;
        }
        if (thing.forms == null) {
            thing.forms = [];
        }
        const form = this.createAffordanceForm(base, this.PROPERTY_DIR, offeredMediaType, opValues, thing.uriVariables);
        thing.forms.push(form);
    }
    getReadableProperties(thing) {
        return Object.entries(thing.properties).filter(([_, value]) => value.writeOnly !== true);
    }
    createPropertyMetaOpValues(thing) {
        const properties = Object.values(thing.properties);
        const numberOfProperties = properties.length;
        if (numberOfProperties === 0) {
            return [];
        }
        const readableProperties = this.getReadableProperties(thing).length;
        const opValues = [];
        if (readableProperties > 0) {
            opValues.push("readmultipleproperties");
        }
        if (readableProperties === numberOfProperties) {
            opValues.push("readallproperties");
        }
        return opValues;
    }
    addFormToAffordance(form, affordance) {
        const affordanceForms = affordance.forms;
        if (affordanceForms == null) {
            affordance.forms = [form];
        }
        else {
            affordanceForms.push(form);
        }
    }
    fillInPropertyBindingData(thing, base, offeredMediaType) {
        for (const [propertyName, property] of Object.entries(thing.properties)) {
            const [readWriteOpValues, observeOpValues] = (0, util_1.getPropertyOpValues)(property);
            for (const formOpValues of [observeOpValues, readWriteOpValues]) {
                if (formOpValues.length === 0) {
                    continue;
                }
                let subprotocol;
                const observeOpValues = (0, util_1.filterPropertyObserveOperations)(formOpValues);
                if (observeOpValues.length > 0) {
                    subprotocol = "cov:observe";
                }
                const form = this.createAffordanceForm(base, this.PROPERTY_DIR, offeredMediaType, formOpValues, thing.uriVariables, propertyName, property.uriVariables, subprotocol);
                this.addFormToAffordance(form, property);
                this.logHrefAssignment(form, "Property", propertyName);
            }
        }
    }
    fillInActionBindingData(thing, base, offeredMediaType) {
        for (const [actionName, action] of Object.entries(thing.actions)) {
            const form = this.createAffordanceForm(base, this.ACTION_DIR, offeredMediaType, "invokeaction", thing.uriVariables, actionName, action.uriVariables);
            this.addFormToAffordance(form, action);
            this.logHrefAssignment(form, "Action", actionName);
        }
    }
    fillInEventBindingData(thing, base, offeredMediaType) {
        for (const [eventName, event] of Object.entries(thing.events)) {
            const form = this.createAffordanceForm(base, this.EVENT_DIR, offeredMediaType, ["subscribeevent", "unsubscribeevent"], thing.uriVariables, eventName, event.uriVariables, "cov:observe");
            this.addFormToAffordance(form, event);
            this.logHrefAssignment(form, "Event", eventName);
        }
    }
    createAffordanceForm(base, affordancePathSegment, offeredMediaType, opValues, thingUriVariables, affordanceName, affordanceUriVariables, subprotocol) {
        const affordanceNamePattern = core_1.Helpers.updateInteractionNameWithUriVariablePattern(affordanceName !== null && affordanceName !== void 0 ? affordanceName : "", affordanceUriVariables, thingUriVariables);
        let href = `${base}/${affordancePathSegment}`;
        if (affordanceNamePattern.length > 0) {
            href += `/${encodeURIComponent(affordanceNamePattern)}`;
        }
        const form = new TD.Form(href, offeredMediaType);
        form.op = opValues;
        form.subprotocol = subprotocol;
        return form;
    }
    logHrefAssignment(form, affordanceType, affordanceName) {
        debug(`CoapServer on port ${this.port} assigns '${form.href}' to ${affordanceType} '${affordanceName}'`);
    }
    setUpIntroductionMethods(thing, urlPath, port) {
        var _a;
        this.createCoreResource(urlPath);
        this.things.set(urlPath, thing);
        const parameters = {
            urlPath,
            port,
            serviceName: "_wot._udp.local",
        };
        (_a = this.mdnsIntroducer) === null || _a === void 0 ? void 0 : _a.registerExposedThing(thing, parameters);
    }
    createCoreResource(urlPath) {
        this.coreResources.set(urlPath, { urlPath, parameters: thingDescriptionParameters });
    }
    destroy(thingId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            debug(`CoapServer on port ${this.getPort()} destroying thingId '${thingId}'`);
            for (const name of this.things.keys()) {
                const exposedThing = this.things.get(name);
                if ((exposedThing === null || exposedThing === void 0 ? void 0 : exposedThing.id) === thingId) {
                    this.things.delete(name);
                    this.coreResources.delete(name);
                    (_a = this.mdnsIntroducer) === null || _a === void 0 ? void 0 : _a.delete(name);
                    info(`CoapServer succesfully destroyed '${exposedThing.title}'`);
                    return true;
                }
            }
            info(`CoapServer failed to destroy thing with thingId '${thingId}'`);
            return false;
        });
    }
    formatCoreLinkFormatResources() {
        return Array.from(this.coreResources.values())
            .map((resource) => {
            var _a, _b;
            const formattedPath = `</${resource.urlPath}>`;
            const parameters = Array.from((_b = (_a = resource.parameters) === null || _a === void 0 ? void 0 : _a.entries()) !== null && _b !== void 0 ? _b : []);
            const parameterValues = parameters.map((parameter) => {
                const key = parameter[0];
                const values = parameter[1].join(" ");
                return `${key}="${values}"`;
            });
            return [formattedPath, ...parameterValues].join(";");
        })
            .join(",");
    }
    handleWellKnownCore(req, res) {
        if (req.method !== "GET") {
            this.sendMethodNotAllowedResponse(res);
            return;
        }
        const payload = this.formatCoreLinkFormatResources();
        this.sendContentResponse(res, payload, "application/link-format");
    }
    handleTdRequest(req, res, thing) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.method !== "GET") {
                this.sendMethodNotAllowedResponse(res);
                return;
            }
            const { contentType, isSupported } = this.processAcceptValue(req);
            if (!isSupported) {
                this.sendResponse(res, "4.06", `Content-Format ${contentType} is not supported by this resource.`);
                return;
            }
            const content = core_1.ContentSerdes.get().valueToContent(thing.getThingDescription(), undefined, contentType);
            const payload = yield content.toBuffer();
            debug(`Sending CoAP response for TD with Content-Format ${contentType}.`);
            this.sendContentResponse(res, payload, contentType);
        });
    }
    processAcceptValue(req) {
        const accept = req.headers.Accept;
        if (typeof accept !== "string") {
            debug(`Request contained no Accept option.`);
            return {
                contentType: core_1.ContentSerdes.TD,
                isSupported: true,
            };
        }
        const isSupported = core_1.ContentSerdes.get().isSupported(accept);
        if (!isSupported) {
            debug(`Request contained an accept option with value ${accept} which is not supported.`);
        }
        debug(`Received an available Content-Format ${accept} in Accept option.`);
        return {
            contentType: accept,
            isSupported,
        };
    }
    handleRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const sourcePort = req.rsinfo.port;
            const hasInvalidPortRange = sourcePort < 1 || sourcePort > 65535;
            if (hasInvalidPortRange) {
                return;
            }
            const origin = this.formatRequestOrigin(req);
            debug(`CoapServer on port ${this.getPort()} received '${req.method}(${req._packet.messageId}) ${req.url}' from ${origin}`);
            res.on("finish", () => debug(`CoapServer replied with '${res.code}' to ${origin}`));
            const contentType = this.getContentTypeFromRequest(req);
            const method = req.method;
            if (!this.checkContentTypeSupportForInput(method, contentType)) {
                this.sendResponse(res, "4.15", "Unsupported Media Type");
                return;
            }
            const requestUri = this.processRequestUri(req);
            if (requestUri === "/") {
                this.handleThingsRequest(method, res);
                return;
            }
            if (requestUri === "/.well-known/core") {
                this.handleWellKnownCore(req, res);
                return;
            }
            const { thingKey, affordanceType, affordanceKey } = this.parseUriSegments(requestUri);
            const thing = this.things.get(thingKey);
            if (thing == null) {
                this.sendNotFoundResponse(res);
                return;
            }
            if (affordanceType == null || affordanceType === "") {
                yield this.handleTdRequest(req, res, thing);
                return;
            }
            switch (affordanceType) {
                case this.PROPERTY_DIR:
                    this.handlePropertyRequest(thing, affordanceKey, req, res, contentType);
                    break;
                case this.ACTION_DIR:
                    this.handleActionRequest(thing, affordanceKey, req, res, contentType);
                    break;
                case this.EVENT_DIR:
                    this.handleEventRequest(thing, affordanceKey, req, res, contentType);
                    break;
                default:
                    this.sendNotFoundResponse(res);
            }
        });
    }
    processRequestUri(req) {
        const uri = req.url;
        if (uri.includes("?")) {
            return uri.substring(0, uri.indexOf("?"));
        }
        return uri;
    }
    handleThingsRequest(method, res) {
        if (method !== "GET") {
            this.sendMethodNotAllowedResponse(res);
            return;
        }
        const payload = JSON.stringify(this.getThingDescriptionPayload());
        this.sendContentResponse(res, payload, core_1.ContentSerdes.DEFAULT);
    }
    handlePropertyRequest(thing, affordanceKey, req, res, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const property = thing.properties[affordanceKey];
            if (property == null) {
                this.handlePropertiesRequest(req, contentType, thing, res);
                return;
            }
            switch (req.method) {
                case "GET":
                    if (req.headers.Observe == null) {
                        this.handleReadProperty(property, req, contentType, thing, res, affordanceKey);
                    }
                    else {
                        this.handleObserveProperty(property, req, contentType, thing, res, affordanceKey);
                    }
                    break;
                case "PUT":
                    if (property.readOnly === true) {
                        this.sendResponse(res, "4.00", "Property readOnly");
                        return;
                    }
                    this.handleWriteProperty(property, req, contentType, thing, res, affordanceKey);
                    break;
                default:
                    this.sendMethodNotAllowedResponse(res);
            }
        });
    }
    handlePropertiesRequest(req, contentType, thing, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const forms = thing.forms;
            if (forms == null) {
                this.sendNotFoundResponse(res);
                return;
            }
            switch (req.method) {
                case "GET":
                    this.handleReadMultipleProperties(forms, req, contentType, thing, res);
                    break;
                default:
                    this.sendMethodNotAllowedResponse(res);
                    break;
            }
        });
    }
    handleReadMultipleProperties(forms, req, contentType, thing, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const interactionOptions = this.createInteractionOptions(forms, thing, req, contentType, thing.uriVariables);
                const readablePropertyKeys = this.getReadableProperties(thing).map(([key, _]) => key);
                const contentMap = yield thing.handleReadMultipleProperties(readablePropertyKeys, interactionOptions);
                const recordResponse = {};
                for (const [key, content] of contentMap.entries()) {
                    const value = core_1.ContentSerdes.get().contentToValue({ type: core_1.ContentSerdes.DEFAULT, body: yield content.toBuffer() }, {});
                    if (value == null) {
                        continue;
                    }
                    recordResponse[key] = value;
                }
                const content = core_1.ContentSerdes.get().valueToContent(recordResponse, undefined, contentType);
                this.streamContentResponse(res, content);
            }
            catch (err) {
                const errorMessage = `${err}`;
                error(`CoapServer on port ${this.getPort()} got internal error on read '${req.url}': ${errorMessage}`);
                this.sendResponse(res, "5.00", errorMessage);
            }
        });
    }
    handleReadProperty(property, req, contentType, thing, res, affordanceKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const interactionOptions = this.createInteractionOptions(property.forms, thing, req, contentType, property.uriVariables);
                const content = yield thing.handleReadProperty(affordanceKey, interactionOptions);
                this.streamContentResponse(res, content);
            }
            catch (err) {
                const errorMessage = `${err}`;
                error(`CoapServer on port ${this.getPort()} got internal error on read '${req.url}': ${errorMessage}`);
                this.sendResponse(res, "5.00", errorMessage);
            }
        });
    }
    handleObserveProperty(property, req, contentType, thing, res, affordanceKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const interactionOptions = this.createInteractionOptions(property.forms, thing, req, contentType, property.uriVariables);
            const listener = this.createContentListener(req, res, this.PROPERTY_DIR, affordanceKey);
            try {
                yield thing.handleObserveProperty(affordanceKey, listener, interactionOptions);
            }
            catch (error) {
                warn(`${error}`);
            }
            res.end();
            res.on("finish", (err) => {
                error(`CoapServer on port ${this.port} failed on observe with: ${err.message}`);
                thing.handleUnobserveProperty(affordanceKey, listener, interactionOptions);
            });
            setTimeout(() => thing.handleUnobserveProperty(affordanceKey, listener, interactionOptions), 60 * 60 * 1000);
        });
    }
    createContentListener(req, res, affordanceType, affordanceKey) {
        return (content) => __awaiter(this, void 0, void 0, function* () {
            try {
                debug(`CoapServer on port ${this.getPort()} sends notification to ${core_1.Helpers.toUriLiteral(req.rsinfo.address)}:${req.rsinfo.port}`);
                this.streamContentResponse(res, content, { end: true });
            }
            catch (err) {
                const code = "5.00";
                if (affordanceType === this.EVENT_DIR) {
                    debug(`CoapServer on port ${this.getPort()} failed '${affordanceKey}' subscription`);
                    this.sendResponse(res, code, "Subscription to event failed");
                }
                else {
                    const errorMessage = `${err}`;
                    debug(`CoapServer on port ${this.getPort()} got internal error on observe '${req.url}': ${errorMessage}`);
                    this.sendResponse(res, code, errorMessage);
                }
            }
        });
    }
    handleWriteProperty(property, req, contentType, thing, res, affordanceKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const interactionOptions = this.createInteractionOptions(property.forms, thing, req, contentType, property.uriVariables);
                yield thing.handleWriteProperty(affordanceKey, new core_1.Content(contentType, stream_1.Readable.from(req.payload)), interactionOptions);
                this.sendChangedResponse(res);
            }
            catch (err) {
                const errorMessage = `${err}`;
                error(`CoapServer on port ${this.getPort()} got internal error on write '${req.url}': ${errorMessage}`);
                this.sendResponse(res, "5.00", errorMessage);
            }
        });
    }
    handleActionRequest(thing, affordanceKey, req, res, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const action = thing.actions[affordanceKey];
            if (action == null) {
                this.sendNotFoundResponse(res);
                return;
            }
            if (req.method !== "POST") {
                this.sendMethodNotAllowedResponse(res);
                return;
            }
            const interactionOptions = this.createInteractionOptions(action.forms, thing, req, contentType, action.uriVariables);
            try {
                const output = yield thing.handleInvokeAction(affordanceKey, new core_1.Content(contentType, stream_1.Readable.from(req.payload)), interactionOptions);
                if (output != null) {
                    this.streamContentResponse(res, output, { end: true });
                }
                else {
                    this.sendChangedResponse(res);
                }
            }
            catch (errror) {
                const errorMessage = `${error}`;
                error(`CoapServer on port ${this.getPort()} got internal error on invoke '${req.url}': ${errorMessage}`);
                this.sendResponse(res, "5.00", errorMessage);
            }
        });
    }
    createInteractionOptions(forms, thing, req, contentType, affordanceUriVariables) {
        const options = {
            formIndex: core_1.ProtocolHelpers.findRequestMatchingFormIndex(forms, this.scheme, req.url, contentType),
        };
        const uriVariables = core_1.Helpers.parseUrlParameters(req.url, thing.uriVariables, affordanceUriVariables);
        if (!this.isEmpty(uriVariables)) {
            options.uriVariables = uriVariables;
        }
        return options;
    }
    handleEventRequest(thing, affordanceKey, req, res, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = thing.events[affordanceKey];
            if (event == null) {
                this.sendNotFoundResponse(res);
                return;
            }
            if (req.method !== "GET") {
                this.sendMethodNotAllowedResponse(res);
                return;
            }
            const observe = req.headers.Observe;
            if (observe == null) {
                debug(`CoapServer on port ${this.getPort()} rejects '${affordanceKey}' event subscription from ${core_1.Helpers.toUriLiteral(req.rsinfo.address)}:${req.rsinfo.port}`);
                this.sendResponse(res, "4.00", "No Observe Option");
                return;
            }
            if (observe === 0) {
                this.avoidDuplicatedObserveRegistration(res);
                const interactionOptions = this.createInteractionOptions(event.forms, thing, req, contentType, event.uriVariables);
                const listener = this.createContentListener(req, res, this.EVENT_DIR, affordanceKey);
                try {
                    yield thing.handleSubscribeEvent(affordanceKey, listener, interactionOptions);
                }
                catch (error) {
                    warn(`${error}`);
                }
                res.end();
                res.on("finish", () => {
                    debug(`CoapServer on port ${this.getPort()} ends '${affordanceKey}' observation from ${core_1.Helpers.toUriLiteral(req.rsinfo.address)}:${req.rsinfo.port}`);
                    thing.handleUnsubscribeEvent(affordanceKey, listener, interactionOptions);
                });
            }
            else if (observe > 0) {
                debug(`CoapServer on port ${this.getPort()} sends '${affordanceKey}' response to ${core_1.Helpers.toUriLiteral(req.rsinfo.address)}:${req.rsinfo.port}`);
                this.sendResponse(res, "5.01", "node-coap issue: no GET cancellation, send RST");
            }
        });
    }
    avoidDuplicatedObserveRegistration(res) {
        const packet = res._packet;
        packet.code = "0.00";
        packet.payload = Buffer.from("");
        packet.reset = false;
        packet.ack = true;
        packet.token = Buffer.alloc(0);
        res._send(res, packet);
        res._packet.confirmable = res._request.confirmable;
        res._packet.token = res._request.token;
    }
    getContentTypeFromRequest(req) {
        const contentType = req.headers["Content-Format"];
        if (contentType == null) {
            warn(`CoapServer on port ${this.getPort()} received no Content-Format from ${core_1.Helpers.toUriLiteral(req.rsinfo.address)}:${req.rsinfo.port}`);
        }
        return contentType !== null && contentType !== void 0 ? contentType : core_1.ContentSerdes.DEFAULT;
    }
    checkContentTypeSupportForInput(method, contentType) {
        const methodsWithPayload = ["PUT", "POST", "FETCH", "iPATCH", "PATCH"];
        const notAMethodWithPayload = !methodsWithPayload.includes(method);
        return notAMethodWithPayload || core_1.ContentSerdes.get().isSupported(contentType);
    }
    getThingDescriptionPayload() {
        return core_1.Helpers.getAddresses().flatMap((address) => Array.from(this.things.keys()).map((thingKey) => `${this.scheme}://${core_1.Helpers.toUriLiteral(address)}:${this.getPort()}/${encodeURIComponent(thingKey)}`));
    }
    parseUriSegments(requestUri) {
        const segments = decodeURI(requestUri).split("/");
        return {
            thingKey: segments[1],
            affordanceType: segments[2],
            affordanceKey: segments[3],
        };
    }
    sendContentResponse(res, payload, contentType) {
        res.setOption("Content-Format", contentType);
        this.sendResponse(res, "2.05", payload);
    }
    sendChangedResponse(res, payload) {
        this.sendResponse(res, "2.04", payload);
    }
    streamContentResponse(res, content, options) {
        res.setOption("Content-Format", content.type);
        res.code = "2.05";
        content.body.pipe(res, options);
    }
    sendNotFoundResponse(res) {
        this.sendResponse(res, "4.04", "Not Found");
    }
    sendMethodNotAllowedResponse(res) {
        this.sendResponse(res, "4.05", "Method Not Allowed");
    }
    sendResponse(res, responseCode, payload) {
        res.code = responseCode;
        res.end(payload);
    }
    formatRequestOrigin(req) {
        const originAddress = req.rsinfo.address;
        const originPort = req.rsinfo.port;
        return `${core_1.Helpers.toUriLiteral(originAddress)}:${originPort}`;
    }
    isEmpty(object) {
        return Object.keys(object).length === 0;
    }
}
exports.default = CoapServer;
//# sourceMappingURL=coap-server.js.map