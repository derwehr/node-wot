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
const mqtt = __importStar(require("mqtt"));
const url = __importStar(require("url"));
const aedes_1 = require("aedes");
const net = __importStar(require("net"));
const tls = __importStar(require("tls"));
const TD = __importStar(require("@node-wot/td-tools"));
const mqtt_1 = require("./mqtt");
const core_1 = require("@node-wot/core");
const stream_1 = require("stream");
const util_1 = require("./util");
const { info, debug, error, warn } = (0, core_1.createLoggers)("binding-mqtt", "mqtt-broker-server");
class MqttBrokerServer {
    constructor(config) {
        var _a, _b;
        this.scheme = "mqtt";
        this.ACTION_SEGMENT_LENGTH = 3;
        this.PROPERTY_SEGMENT_LENGTH = 4;
        this.THING_NAME_SEGMENT_INDEX = 0;
        this.INTERACTION_TYPE_SEGMENT_INDEX = 1;
        this.INTERACTION_NAME_SEGMENT_INDEX = 2;
        this.INTERACTION_EXT_SEGMENT_INDEX = 3;
        this.defaults = { uri: "mqtt://localhost:1883" };
        this.port = -1;
        this.address = undefined;
        this.things = new Map();
        this.config = config !== null && config !== void 0 ? config : this.defaults;
        this.config.uri = (_a = this.config.uri) !== null && _a !== void 0 ? _a : this.defaults.uri;
        if (config.uri.indexOf("://") === -1) {
            config.uri = this.scheme + "://" + config.uri;
        }
        this.brokerURI = config.uri;
        const selfHost = (_b = config.selfHost) !== null && _b !== void 0 ? _b : false;
        if (selfHost) {
            this.hostedServer = (0, aedes_1.Server)({});
            let server;
            if (config.key) {
                server = tls.createServer({ key: config.key, cert: config.cert }, this.hostedServer.handle);
            }
            else {
                server = net.createServer(this.hostedServer.handle);
            }
            const parsed = new url.URL(this.brokerURI);
            const port = parseInt(parsed.port);
            this.port = port > 0 ? port : 1883;
            this.hostedBroker = server.listen(port, parsed.hostname);
            this.hostedServer.authenticate = this.selfHostAuthentication.bind(this);
        }
    }
    static brokerIsInitialized(broker) {
        if (broker === undefined) {
            throw new Error(`Broker not initialized. You need to start the ${MqttBrokerServer.name} before you can expose things.`);
        }
    }
    expose(thing) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.broker === undefined) {
                return;
            }
            let name = thing.title;
            if (this.things.has(name)) {
                const suffix = name.match(/.+_([0-9]+)$/);
                if (suffix !== null) {
                    name = name.slice(0, -suffix[1].length) + (1 + parseInt(suffix[1]));
                }
                else {
                    name = name + "_2";
                }
            }
            debug(`MqttBrokerServer at ${this.brokerURI} exposes '${thing.title}' as unique '${name}/*'`);
            this.things.set(name, thing);
            for (const propertyName in thing.properties) {
                this.exposeProperty(name, propertyName, thing);
            }
            for (const actionName in thing.actions) {
                this.exposeAction(name, actionName, thing);
            }
            for (const eventName in thing.events) {
                this.exposeEvent(name, eventName, thing);
            }
            this.broker.on("message", this.handleMessage.bind(this));
            this.broker.publish(name, JSON.stringify(thing.getThingDescription()), { retain: true });
        });
    }
    exposeProperty(name, propertyName, thing) {
        var _a, _b;
        MqttBrokerServer.brokerIsInitialized(this.broker);
        const topic = encodeURIComponent(name) + "/properties/" + encodeURIComponent(propertyName);
        const property = thing.properties[propertyName];
        const writeOnly = (_a = property.writeOnly) !== null && _a !== void 0 ? _a : false;
        if (!writeOnly) {
            const href = this.brokerURI + "/" + topic;
            const form = new TD.Form(href, core_1.ContentSerdes.DEFAULT);
            form.op = ["readproperty", "observeproperty", "unobserveproperty"];
            property.forms.push(form);
            debug(`MqttBrokerServer at ${this.brokerURI} assigns '${href}' to property '${propertyName}'`);
            const observeListener = (content) => __awaiter(this, void 0, void 0, function* () {
                debug(`MqttBrokerServer at ${this.brokerURI} publishing to Property topic '${propertyName}' `);
                const buffer = yield content.toBuffer();
                if (this.broker === undefined) {
                    warn(`MqttBrokerServer at ${this.brokerURI} has no client to publish to. Probably it was closed.`);
                    return;
                }
                this.broker.publish(topic, buffer);
            });
            thing.handleObserveProperty(propertyName, observeListener, { formIndex: property.forms.length - 1 });
        }
        const readOnly = (_b = property.readOnly) !== null && _b !== void 0 ? _b : false;
        if (!readOnly) {
            const href = this.brokerURI + "/" + topic + "/writeproperty";
            this.broker.subscribe(topic + "/writeproperty");
            const form = new TD.Form(href, core_1.ContentSerdes.DEFAULT);
            form.op = ["writeproperty"];
            thing.properties[propertyName].forms.push(form);
            debug(`MqttBrokerServer at ${this.brokerURI} assigns '${href}' to property '${propertyName}'`);
        }
    }
    exposeAction(name, actionName, thing) {
        MqttBrokerServer.brokerIsInitialized(this.broker);
        const topic = encodeURIComponent(name) + "/actions/" + encodeURIComponent(actionName);
        this.broker.subscribe(topic);
        const href = this.brokerURI + "/" + topic;
        const form = new TD.Form(href, core_1.ContentSerdes.DEFAULT);
        form.op = ["invokeaction"];
        thing.actions[actionName].forms.push(form);
        debug(`MqttBrokerServer at ${this.brokerURI} assigns '${href}' to Action '${actionName}'`);
    }
    exposeEvent(name, eventName, thing) {
        const topic = encodeURIComponent(name) + "/events/" + encodeURIComponent(eventName);
        const event = thing.events[eventName];
        const href = this.brokerURI + "/" + topic;
        const form = new mqtt_1.MqttForm(href, core_1.ContentSerdes.DEFAULT);
        form["mqv:qos"] = "2";
        form.op = ["subscribeevent", "unsubscribeevent"];
        event.forms.push(form);
        debug(`MqttBrokerServer at ${this.brokerURI} assigns '${href}' to Event '${eventName}'`);
        const eventListener = (content) => __awaiter(this, void 0, void 0, function* () {
            if (this.broker === undefined) {
                warn(`MqttBrokerServer at ${this.brokerURI} has no client to publish to. Probably it was closed.`);
                return;
            }
            if (content == null) {
                warn(`MqttBrokerServer on port ${this.getPort()} cannot process data for Event ${eventName}`);
                thing.handleUnsubscribeEvent(eventName, eventListener, { formIndex: event.forms.length - 1 });
                return;
            }
            debug(`MqttBrokerServer at ${this.brokerURI} publishing to Event topic '${eventName}' `);
            const buffer = yield content.toBuffer();
            this.broker.publish(topic, buffer, { retain: form["mqv:retain"], qos: (0, util_1.mapQoS)(form["mqv:qos"]) });
        });
        thing.handleSubscribeEvent(eventName, eventListener, { formIndex: event.forms.length - 1 });
    }
    handleMessage(receivedTopic, rawPayload, packet) {
        const segments = receivedTopic.split("/");
        let payload;
        if (rawPayload instanceof Buffer) {
            payload = rawPayload;
        }
        else if (typeof rawPayload === "string") {
            payload = Buffer.from(rawPayload);
        }
        else {
            warn(`MqttBrokerServer on port ${this.getPort()} received unexpected payload type`);
            return;
        }
        if (segments.length === this.ACTION_SEGMENT_LENGTH) {
            debug(`MqttBrokerServer at ${this.brokerURI} received message for '${receivedTopic}'`);
            const thing = this.things.get(segments[this.THING_NAME_SEGMENT_INDEX]);
            if (thing != null) {
                if (segments[this.INTERACTION_TYPE_SEGMENT_INDEX] === "actions") {
                    const action = thing.actions[segments[this.INTERACTION_NAME_SEGMENT_INDEX]];
                    if (action != null) {
                        this.handleAction(action, packet, payload, segments, thing);
                        return;
                    }
                }
            }
        }
        else if (segments.length === this.PROPERTY_SEGMENT_LENGTH &&
            segments[this.INTERACTION_EXT_SEGMENT_INDEX] === "writeproperty") {
            const thing = this.things.get(segments[this.THING_NAME_SEGMENT_INDEX]);
            if (thing != null) {
                if (segments[this.INTERACTION_TYPE_SEGMENT_INDEX] === "properties") {
                    const property = thing.properties[segments[this.INTERACTION_NAME_SEGMENT_INDEX]];
                    if (property != null) {
                        this.handlePropertyWrite(property, packet, payload, segments, thing);
                    }
                }
            }
            return;
        }
        warn(`MqttBrokerServer at ${this.brokerURI} received message for invalid topic '${receivedTopic}'`);
    }
    handleAction(action, packet, payload, segments, thing) {
        var _a, _b, _c;
        const contentType = (_b = (_a = packet === null || packet === void 0 ? void 0 : packet.properties) === null || _a === void 0 ? void 0 : _a.contentType) !== null && _b !== void 0 ? _b : core_1.ContentSerdes.DEFAULT;
        const options = {
            formIndex: core_1.ProtocolHelpers.findRequestMatchingFormIndex(action.forms, this.scheme, this.brokerURI, contentType),
        };
        const formContentType = (_c = action.forms[options.formIndex].contentType) !== null && _c !== void 0 ? _c : core_1.ContentSerdes.DEFAULT;
        const inputContent = new core_1.Content(formContentType, stream_1.Readable.from(payload));
        thing
            .handleInvokeAction(segments[this.INTERACTION_NAME_SEGMENT_INDEX], inputContent, options)
            .then((output) => {
            if (output != null) {
                warn(`MqttBrokerServer at ${this.brokerURI} cannot return output '${segments[this.INTERACTION_NAME_SEGMENT_INDEX]}'`);
            }
        })
            .catch((err) => {
            error(`MqttBrokerServer at ${this.brokerURI} got error on invoking '${segments[this.INTERACTION_NAME_SEGMENT_INDEX]}': ${err.message}`);
        });
    }
    handlePropertyWrite(property, packet, payload, segments, thing) {
        var _a, _b, _c, _d;
        const readOnly = (_a = property.readOnly) !== null && _a !== void 0 ? _a : false;
        if (!readOnly) {
            const contentType = (_c = (_b = packet === null || packet === void 0 ? void 0 : packet.properties) === null || _b === void 0 ? void 0 : _b.contentType) !== null && _c !== void 0 ? _c : core_1.ContentSerdes.DEFAULT;
            const options = {
                formIndex: core_1.ProtocolHelpers.findRequestMatchingFormIndex(property.forms, this.scheme, this.brokerURI, contentType),
            };
            const formContentType = (_d = property.forms[options.formIndex].contentType) !== null && _d !== void 0 ? _d : core_1.ContentSerdes.DEFAULT;
            const inputContent = new core_1.Content(formContentType, stream_1.Readable.from(payload));
            try {
                thing.handleWriteProperty(segments[this.INTERACTION_NAME_SEGMENT_INDEX], inputContent, options);
            }
            catch (err) {
                error(`MqttBrokerServer at ${this.brokerURI} got error on writing to property '${segments[this.INTERACTION_NAME_SEGMENT_INDEX]}': ${err}`);
            }
        }
        else {
            warn(`MqttBrokerServer at ${this.brokerURI} received message for readOnly property at '${segments.join("/")}'`);
        }
    }
    destroy(thingId) {
        return __awaiter(this, void 0, void 0, function* () {
            debug(`MqttBrokerServer on port ${this.getPort()} destroying thingId '${thingId}'`);
            let removedThing;
            for (const name of Array.from(this.things.keys())) {
                const expThing = this.things.get(name);
                if (expThing != null && expThing.id != null && expThing.id === thingId) {
                    this.things.delete(name);
                    removedThing = expThing;
                }
            }
            if (removedThing != null) {
                info(`MqttBrokerServer succesfully destroyed '${removedThing.title}'`);
            }
            else {
                info(`MqttBrokerServer failed to destroy thing with thingId '${thingId}'`);
            }
            return removedThing !== undefined;
        });
    }
    start(servient) {
        return new Promise((resolve, reject) => {
            if (this.brokerURI === undefined) {
                warn(`No broker defined for MQTT server binding - skipping`);
                resolve();
            }
            else {
                if (this.config.psw === undefined) {
                    debug(`MqttBrokerServer trying to connect to broker at ${this.brokerURI}`);
                }
                else if (this.config.clientId === undefined) {
                    debug(`MqttBrokerServer trying to connect to secured broker at ${this.brokerURI}`);
                }
                else if (this.config.protocolVersion === undefined) {
                    debug(`MqttBrokerServer trying to connect to secured broker at ${this.brokerURI} with client ID ${this.config.clientId}`);
                }
                else {
                    debug(`MqttBrokerServer trying to connect to secured broker at ${this.brokerURI} with client ID ${this.config.clientId}`);
                }
                this.broker = mqtt.connect(this.brokerURI, this.config);
                this.broker.on("connect", () => {
                    info(`MqttBrokerServer connected to broker at ${this.brokerURI}`);
                    const parsed = new url.URL(this.brokerURI);
                    this.address = parsed.hostname;
                    const port = parseInt(parsed.port);
                    this.port = port > 0 ? port : 1883;
                    resolve();
                });
                this.broker.on("error", (err) => {
                    error(`MqttBrokerServer could not connect to broker at ${this.brokerURI}`);
                    reject(err);
                });
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.broker !== undefined) {
                this.broker.unsubscribe("*");
                this.broker.end(true);
            }
            if (this.hostedBroker !== undefined) {
                yield new Promise((resolve) => this.hostedServer.close(() => resolve()));
                yield new Promise((resolve) => this.hostedBroker.close(() => resolve()));
            }
        });
    }
    getPort() {
        return this.port;
    }
    getAddress() {
        return this.address;
    }
    selfHostAuthentication(_client, username, password, done) {
        var _a;
        if (this.config.selfHostAuthentication && username !== undefined) {
            for (let i = 0; i < this.config.selfHostAuthentication.length; i++) {
                if (username === this.config.selfHostAuthentication[i].username &&
                    password.equals(Buffer.from((_a = this.config.selfHostAuthentication[i].password) !== null && _a !== void 0 ? _a : ""))) {
                    done(null, true);
                    return;
                }
            }
            done(null, false);
            return;
        }
        done(null, true);
    }
}
exports.default = MqttBrokerServer;
//# sourceMappingURL=mqtt-broker-server.js.map