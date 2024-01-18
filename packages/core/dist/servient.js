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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Servient_wotInstance, _Servient_shutdown;
Object.defineProperty(exports, "__esModule", { value: true });
const wot_impl_1 = __importDefault(require("./wot-impl"));
const content_serdes_1 = __importDefault(require("./content-serdes"));
const uuid_1 = require("uuid");
const logger_1 = require("./logger");
const { debug, warn } = (0, logger_1.createLoggers)("core", "servient");
class Servient {
    constructor() {
        this.servers = [];
        this.clientFactories = new Map();
        this.things = new Map();
        this.credentialStore = new Map();
        _Servient_wotInstance.set(this, void 0);
        _Servient_shutdown.set(this, false);
    }
    addMediaType(codec, offered = false) {
        content_serdes_1.default.addCodec(codec, offered);
    }
    expose(thing) {
        if (this.servers.length === 0) {
            warn(`Servient has no servers to expose Things`);
            return new Promise((resolve) => {
                resolve();
            });
        }
        debug(`Servient exposing '${thing.title}'`);
        const tdTemplate = JSON.parse(JSON.stringify(thing));
        thing.forms = [];
        for (const name in thing.properties) {
            thing.properties[name].forms = [];
        }
        for (const name in thing.actions) {
            thing.actions[name].forms = [];
        }
        for (const name in thing.events) {
            thing.events[name].forms = [];
        }
        const serverPromises = [];
        this.servers.forEach((server) => {
            serverPromises.push(server.expose(thing, tdTemplate));
        });
        return new Promise((resolve, reject) => {
            Promise.all(serverPromises)
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }
    addThing(thing) {
        if (!thing.id) {
            thing.id = "urn:uuid:" + (0, uuid_1.v4)();
            warn(`Servient generating ID for '${thing.title}': '${thing.id}'`);
        }
        if (!this.things.has(thing.id)) {
            this.things.set(thing.id, thing);
            debug(`Servient reset ID '${thing.id}' with '${thing.title}'`);
            return true;
        }
        else {
            return false;
        }
    }
    destroyThing(thingId) {
        return new Promise((resolve, reject) => {
            if (this.things.has(thingId)) {
                debug(`Servient destroying thing with id '${thingId}'`);
                this.things.delete(thingId);
                const serverPromises = [];
                this.servers.forEach((server) => {
                    serverPromises.push(server.destroy(thingId));
                });
                Promise.all(serverPromises)
                    .then(() => resolve(true))
                    .catch((err) => reject(err));
            }
            else {
                warn(`Servient was asked to destroy thing but failed to find thing with id '${thingId}'`);
                resolve(false);
            }
        });
    }
    getThing(id) {
        if (this.things.has(id)) {
            return this.things.get(id);
        }
        else
            return undefined;
    }
    getThings() {
        debug(`Servient getThings size == '${this.things.size}'`);
        const ts = {};
        this.things.forEach((thing, id) => {
            ts[id] = thing.getThingDescription();
        });
        return ts;
    }
    addServer(server) {
        this.things.forEach((thing, id) => server.expose(thing));
        this.servers.push(server);
        return true;
    }
    getServers() {
        return this.servers.slice(0);
    }
    addClientFactory(clientFactory) {
        debug(`Servient adding client factory for '${clientFactory.scheme}'`);
        this.clientFactories.set(clientFactory.scheme, clientFactory);
    }
    removeClientFactory(scheme) {
        var _a;
        debug(`Servient removing client factory for '${scheme}'`);
        (_a = this.clientFactories.get(scheme)) === null || _a === void 0 ? void 0 : _a.destroy();
        return this.clientFactories.delete(scheme);
    }
    hasClientFor(scheme) {
        debug(`Servient checking for '${scheme}' scheme in ${this.clientFactories.size} ClientFactories`);
        return this.clientFactories.has(scheme);
    }
    getClientFor(scheme) {
        const clientFactory = this.clientFactories.get(scheme);
        if (clientFactory) {
            debug(`Servient creating client for scheme '${scheme}'`);
            return clientFactory.getClient();
        }
        else {
            throw new Error(`Servient has no ClientFactory for scheme '${scheme}'`);
        }
    }
    getClientSchemes() {
        return Array.from(this.clientFactories.keys());
    }
    addCredentials(credentials) {
        if (typeof credentials === "object") {
            for (const i in credentials) {
                debug(`Servient storing credentials for '${i}'`);
                let currentCredentials = this.credentialStore.get(i);
                if (!currentCredentials) {
                    currentCredentials = [];
                    this.credentialStore.set(i, currentCredentials);
                }
                currentCredentials.push(credentials[i]);
            }
        }
    }
    getCredentials(identifier) {
        debug(`Servient looking up credentials for '${identifier}' (@deprecated)`);
        const currentCredentials = this.credentialStore.get(identifier);
        if (currentCredentials && currentCredentials.length > 0) {
            return currentCredentials[0];
        }
        else {
            return undefined;
        }
    }
    retrieveCredentials(identifier) {
        debug(`Servient looking up credentials for '${identifier}'`);
        return this.credentialStore.get(identifier);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _Servient_wotInstance, "f") !== undefined) {
                debug("Servient started already -> nop -> returning previous WoT implementation");
                return __classPrivateFieldGet(this, _Servient_wotInstance, "f");
            }
            if (__classPrivateFieldGet(this, _Servient_shutdown, "f")) {
                throw Error("Servient cannot be started (again) since it was already stopped");
            }
            const serverStatus = [];
            this.servers.forEach((server) => serverStatus.push(server.start(this)));
            this.clientFactories.forEach((clientFactory) => clientFactory.init());
            yield Promise.all(serverStatus);
            return (__classPrivateFieldSet(this, _Servient_wotInstance, new wot_impl_1.default(this), "f"));
        });
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _Servient_wotInstance, "f") === undefined) {
                throw Error("Servient cannot be shutdown, wasn't even started");
            }
            if (__classPrivateFieldGet(this, _Servient_shutdown, "f")) {
                debug("Servient shutdown already -> nop");
                return;
            }
            this.clientFactories.forEach((clientFactory) => clientFactory.destroy());
            const promises = this.servers.map((server) => server.stop());
            yield Promise.all(promises);
            __classPrivateFieldSet(this, _Servient_shutdown, true, "f");
            __classPrivateFieldSet(this, _Servient_wotInstance, undefined, "f");
        });
    }
}
exports.default = Servient;
_Servient_wotInstance = new WeakMap(), _Servient_shutdown = new WeakMap();
//# sourceMappingURL=servient.js.map