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
var _ConsumedThingProperty_name, _ConsumedThingProperty_thing, _ConsumedThingAction_name, _ConsumedThingAction_thing, _ConsumedThingEvent_name, _ConsumedThingEvent_thing, _ConsumedThing_servient, _ConsumedThing_clients;
Object.defineProperty(exports, "__esModule", { value: true });
const TD = __importStar(require("@node-wot/td-tools"));
const helpers_1 = __importDefault(require("./helpers"));
const content_serdes_1 = __importDefault(require("./content-serdes"));
const UriTemplate = require("uritemplate");
const interaction_output_1 = require("./interaction-output");
const logger_1 = require("./logger");
const { debug, warn } = (0, logger_1.createLoggers)("core", "consumed-thing");
var Affordance;
(function (Affordance) {
    Affordance[Affordance["PropertyAffordance"] = 0] = "PropertyAffordance";
    Affordance[Affordance["ActionAffordance"] = 1] = "ActionAffordance";
    Affordance[Affordance["EventAffordance"] = 2] = "EventAffordance";
})(Affordance || (Affordance = {}));
class ConsumedThingProperty extends TD.ThingProperty {
    constructor(name, thing) {
        super();
        _ConsumedThingProperty_name.set(this, void 0);
        _ConsumedThingProperty_thing.set(this, void 0);
        __classPrivateFieldSet(this, _ConsumedThingProperty_name, name, "f");
        __classPrivateFieldSet(this, _ConsumedThingProperty_thing, thing, "f");
    }
}
_ConsumedThingProperty_name = new WeakMap(), _ConsumedThingProperty_thing = new WeakMap();
class ConsumedThingAction extends TD.ThingAction {
    constructor(name, thing) {
        super();
        _ConsumedThingAction_name.set(this, void 0);
        _ConsumedThingAction_thing.set(this, void 0);
        __classPrivateFieldSet(this, _ConsumedThingAction_name, name, "f");
        __classPrivateFieldSet(this, _ConsumedThingAction_thing, thing, "f");
    }
}
_ConsumedThingAction_name = new WeakMap(), _ConsumedThingAction_thing = new WeakMap();
class ConsumedThingEvent extends TD.ThingEvent {
    constructor(name, thing) {
        super();
        _ConsumedThingEvent_name.set(this, void 0);
        _ConsumedThingEvent_thing.set(this, void 0);
        __classPrivateFieldSet(this, _ConsumedThingEvent_name, name, "f");
        __classPrivateFieldSet(this, _ConsumedThingEvent_thing, thing, "f");
    }
}
_ConsumedThingEvent_name = new WeakMap(), _ConsumedThingEvent_thing = new WeakMap();
class InternalSubscription {
    constructor(thing, name, client) {
        this.thing = thing;
        this.name = name;
        this.client = client;
        this.active = true;
    }
}
function handleUriVariables(thing, ti, form, options) {
    const ut = UriTemplate.parse(form.href);
    const uriVariables = helpers_1.default.parseInteractionOptions(thing, ti, options).uriVariables;
    const updatedHref = ut.expand(uriVariables !== null && uriVariables !== void 0 ? uriVariables : {});
    if (updatedHref !== form.href) {
        const updForm = Object.assign({}, form);
        updForm.href = updatedHref;
        form = updForm;
        debug(`ConsumedThing '${thing.title}' update form URI to ${form.href}`);
    }
    return form;
}
class InternalPropertySubscription extends InternalSubscription {
    constructor(thing, name, client, form) {
        var _a;
        super(thing, name, client);
        this.form = form;
        this.active = false;
        const index = (_a = this.thing.properties) === null || _a === void 0 ? void 0 : _a[name].forms.indexOf(form);
        if (index === undefined || index < 0) {
            throw new Error(`Could not find form ${form.href} in property ${name}`);
        }
        this.formIndex = index;
    }
    stop(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.unobserveProperty(options);
            this.thing["observedProperties"].delete(this.name);
        });
    }
    unobserveProperty(options = {}) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const tp = this.thing.properties[this.name];
            if (tp == null) {
                throw new Error(`ConsumedThing '${this.thing.title}' does not have property ${this.name}`);
            }
            (_a = options.formIndex) !== null && _a !== void 0 ? _a : (options.formIndex = this.matchingUnsubscribeForm());
            const { form } = this.thing.getClientFor(tp.forms, "unobserveproperty", Affordance.PropertyAffordance, options);
            if (form == null) {
                throw new Error(`ConsumedThing '${this.thing.title}' did not get suitable form`);
            }
            const formWithoutURIvariables = handleUriVariables(this.thing, tp, form, options);
            debug(`ConsumedThing '${this.thing.title}' unobserving to ${form.href}`);
            yield this.client.unlinkResource(formWithoutURIvariables);
            this.active = false;
        });
    }
    matchingUnsubscribeForm() {
        const refForm = this.thing.properties[this.name].forms[this.formIndex];
        if (Array.isArray(refForm.op) && refForm.op.includes("unobserveproperty")) {
            return this.formIndex;
        }
        const bestFormMatch = this.findFormIndexWithScoring(this.formIndex, this.thing.properties[this.name].forms, "unobserveproperty");
        if (bestFormMatch === -1) {
            throw new Error(`Could not find matching form for unsubscribe`);
        }
        return bestFormMatch;
    }
    findFormIndexWithScoring(formIndex, forms, operation) {
        var _a;
        const refForm = forms[formIndex];
        let maxScore = 0;
        let maxScoreIndex = -1;
        for (let i = 0; i < forms.length; i++) {
            let score = 0;
            const form = forms[i];
            if (form.op === operation || (((_a = form === null || form === void 0 ? void 0 : form.op) === null || _a === void 0 ? void 0 : _a.includes(operation)) === true && Array.isArray(form.op) === true)) {
                score += 1;
            }
            if (new URL(form.href).origin === new URL(refForm.href).origin) {
                score += 1;
            }
            if (form.contentType === refForm.contentType) {
                score += 1;
            }
            if (score > maxScore) {
                maxScore = score;
                maxScoreIndex = i;
            }
        }
        return maxScoreIndex;
    }
}
function findFormIndexWithScoring(formIndex, forms, operation) {
    var _a;
    const refForm = forms[formIndex];
    let maxScore = 0;
    let maxScoreIndex = -1;
    for (let i = 0; i < forms.length; i++) {
        let score = 0;
        const form = forms[i];
        if (form.op === operation || (((_a = form === null || form === void 0 ? void 0 : form.op) === null || _a === void 0 ? void 0 : _a.includes(operation)) === true && Array.isArray(form.op) === true)) {
            score += 1;
        }
        if (new URL(form.href).origin === new URL(refForm.href).origin) {
            score += 1;
        }
        if (form.contentType === refForm.contentType) {
            score += 1;
        }
        if (score > maxScore) {
            maxScore = score;
            maxScoreIndex = i;
        }
    }
    return maxScoreIndex;
}
class InternalEventSubscription extends InternalSubscription {
    constructor(thing, name, client, form) {
        var _a;
        super(thing, name, client);
        this.form = form;
        const index = (_a = this.thing.events) === null || _a === void 0 ? void 0 : _a[name].forms.indexOf(form);
        if (index === undefined || index < 0) {
            throw new Error(`Could not find form ${form.href} in event ${name}`);
        }
        this.formIndex = index;
    }
    stop(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.unsubscribeEvent(options);
            this.thing["subscribedEvents"].delete(this.name);
        });
    }
    unsubscribeEvent(options = {}) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const te = this.thing.events[this.name];
            if (te == null) {
                throw new Error(`ConsumedThing '${this.thing.title}' does not have event ${this.name}`);
            }
            (_a = options.formIndex) !== null && _a !== void 0 ? _a : (options.formIndex = this.matchingUnsubscribeForm());
            const { form } = this.thing.getClientFor(te.forms, "unsubscribeevent", Affordance.EventAffordance, options);
            if (form == null) {
                throw new Error(`ConsumedThing '${this.thing.title}' did not get suitable form`);
            }
            const formWithoutURIvariables = handleUriVariables(this.thing, te, form, options);
            debug(`ConsumedThing '${this.thing.title}' unsubscribing to ${form.href}`);
            this.client.unlinkResource(formWithoutURIvariables);
            this.active = false;
        });
    }
    matchingUnsubscribeForm() {
        const refForm = this.thing.events[this.name].forms[this.formIndex];
        if (refForm.op == null || (Array.isArray(refForm.op) && refForm.op.includes("unsubscribeevent"))) {
            return this.formIndex;
        }
        const bestFormMatch = findFormIndexWithScoring(this.formIndex, this.thing.events[this.name].forms, "unsubscribeevent");
        if (bestFormMatch === -1) {
            throw new Error(`Could not find matching form for unsubscribe`);
        }
        return bestFormMatch;
    }
}
class ConsumedThing extends TD.Thing {
    constructor(servient, thingModel = {}) {
        super();
        _ConsumedThing_servient.set(this, void 0);
        _ConsumedThing_clients.set(this, void 0);
        this.subscribedEvents = new Map();
        this.observedProperties = new Map();
        __classPrivateFieldSet(this, _ConsumedThing_servient, servient, "f");
        __classPrivateFieldSet(this, _ConsumedThing_clients, new Map(), "f");
        this.properties = {};
        this.actions = {};
        this.events = {};
        const deepClonedModel = structuredClone(thingModel);
        Object.assign(this, deepClonedModel);
        this.extendInteractions();
    }
    getThingDescription() {
        return JSON.parse(JSON.stringify(this));
    }
    emitEvent(name, data) {
        warn("not implemented");
    }
    extendInteractions() {
        for (const propertyName in this.properties) {
            const newProp = helpers_1.default.extend(this.properties[propertyName], new ConsumedThingProperty(propertyName, this));
            this.properties[propertyName] = newProp;
        }
        for (const actionName in this.actions) {
            const newAction = helpers_1.default.extend(this.actions[actionName], new ConsumedThingAction(actionName, this));
            this.actions[actionName] = newAction;
        }
        for (const eventName in this.events) {
            const newEvent = helpers_1.default.extend(this.events[eventName], new ConsumedThingEvent(eventName, this));
            this.events[eventName] = newEvent;
        }
    }
    findForm(forms, op, affordance, schemes, idx) {
        let form;
        for (const f of forms) {
            let fop = "";
            if (f.op !== undefined) {
                fop = f.op;
            }
            else {
                switch (affordance) {
                    case Affordance.PropertyAffordance:
                        fop = ["readproperty", "writeproperty"];
                        break;
                    case Affordance.ActionAffordance:
                        fop = "invokeaction";
                        break;
                    case Affordance.EventAffordance:
                        fop = "subscribeevent";
                        break;
                }
            }
            if (fop.indexOf(op) !== -1 && f.href.indexOf(schemes[idx] + ":") !== -1) {
                form = f;
                break;
            }
        }
        return form;
    }
    getSecuritySchemes(security) {
        const scs = [];
        for (const s of security) {
            const ws = this.securityDefinitions[s + ""];
            if (ws != null) {
                scs.push(ws);
            }
        }
        return scs;
    }
    ensureClientSecurity(client, form) {
        if (this.securityDefinitions != null) {
            const logStatement = () => debug(`ConsumedThing '${this.title}' setting credentials for ${client} based on thing security`);
            if (form != null && Array.isArray(form.security) && form.security.length > 0) {
                logStatement();
                client.setSecurity(this.getSecuritySchemes(form.security), __classPrivateFieldGet(this, _ConsumedThing_servient, "f").retrieveCredentials(this.id));
            }
            else if (Array.isArray(this.security) && this.security.length > 0) {
                logStatement();
                client.setSecurity(this.getSecuritySchemes(this.security), __classPrivateFieldGet(this, _ConsumedThing_servient, "f").getCredentials(this.id));
            }
        }
    }
    getClientFor(forms, op, affordance, options) {
        if (forms.length === 0) {
            throw new Error(`ConsumedThing '${this.title}' has no links for this interaction`);
        }
        let form;
        let client;
        if ((options === null || options === void 0 ? void 0 : options.formIndex) !== undefined) {
            debug(`ConsumedThing '${this.title}' asked to use formIndex '${options.formIndex}'`);
            if (options.formIndex >= 0 && options.formIndex < forms.length) {
                form = forms[options.formIndex];
                const scheme = helpers_1.default.extractScheme(form.href);
                if (__classPrivateFieldGet(this, _ConsumedThing_servient, "f").hasClientFor(scheme)) {
                    debug(`ConsumedThing '${this.title}' got client for '${scheme}'`);
                    client = __classPrivateFieldGet(this, _ConsumedThing_servient, "f").getClientFor(scheme);
                    if (!__classPrivateFieldGet(this, _ConsumedThing_clients, "f").get(scheme)) {
                        this.ensureClientSecurity(client, form);
                        __classPrivateFieldGet(this, _ConsumedThing_clients, "f").set(scheme, client);
                    }
                }
                else {
                    throw new Error(`ConsumedThing '${this.title}' missing ClientFactory for '${scheme}'`);
                }
            }
            else {
                throw new Error(`ConsumedThing '${this.title}' missing formIndex '${options.formIndex}'`);
            }
        }
        else {
            const schemes = forms.map((link) => helpers_1.default.extractScheme(link.href));
            const cacheIdx = schemes.findIndex((scheme) => __classPrivateFieldGet(this, _ConsumedThing_clients, "f").has(scheme));
            if (cacheIdx !== -1) {
                debug(`ConsumedThing '${this.title}' chose cached client for '${schemes[cacheIdx]}'`);
                client = __classPrivateFieldGet(this, _ConsumedThing_clients, "f").get(schemes[cacheIdx]);
                form = this.findForm(forms, op, affordance, schemes, cacheIdx);
            }
            else {
                debug(`ConsumedThing '${this.title}' has no client in cache (${cacheIdx})`);
                const srvIdx = schemes.findIndex((scheme) => __classPrivateFieldGet(this, _ConsumedThing_servient, "f").hasClientFor(scheme));
                if (srvIdx === -1)
                    throw new Error(`ConsumedThing '${this.title}' missing ClientFactory for '${schemes}'`);
                client = __classPrivateFieldGet(this, _ConsumedThing_servient, "f").getClientFor(schemes[srvIdx]);
                debug(`ConsumedThing '${this.title}' got new client for '${schemes[srvIdx]}'`);
                __classPrivateFieldGet(this, _ConsumedThing_clients, "f").set(schemes[srvIdx], client);
                form = this.findForm(forms, op, affordance, schemes, srvIdx);
                this.ensureClientSecurity(client, form);
            }
        }
        return { client, form };
    }
    readProperty(propertyName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const tp = this.properties[propertyName];
            if (tp == null) {
                throw new Error(`ConsumedThing '${this.title}' does not have property ${propertyName}`);
            }
            let { client, form } = this.getClientFor(tp.forms, "readproperty", Affordance.PropertyAffordance, options);
            if (form == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable form`);
            }
            if (client == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable client for ${form.href}`);
            }
            debug(`ConsumedThing '${this.title}' reading ${form.href}`);
            form = this.handleUriVariables(tp, form, options);
            const content = yield client.readResource(form);
            return new interaction_output_1.InteractionOutput(content, form, tp);
        });
    }
    _readProperties(propertyNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (const propertyName of propertyNames) {
                promises.push(this.readProperty(propertyName));
            }
            const output = new Map();
            try {
                const result = yield Promise.all(promises);
                let index = 0;
                for (const propertyName of propertyNames) {
                    output.set(propertyName, result[index]);
                    index++;
                }
                return output;
            }
            catch (err) {
                throw new Error(`ConsumedThing '${this.title}', failed to read properties: ${propertyNames}.\n Error: ${err}`);
            }
        });
    }
    readAllProperties(options) {
        const propertyNames = [];
        for (const propertyName in this.properties) {
            const tp = this.properties[propertyName];
            const { form } = this.getClientFor(tp.forms, "readproperty", Affordance.PropertyAffordance, options);
            if (form != null) {
                propertyNames.push(propertyName);
            }
        }
        return this._readProperties(propertyNames);
    }
    readMultipleProperties(propertyNames, options) {
        return this._readProperties(propertyNames);
    }
    writeProperty(propertyName, value, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const tp = this.properties[propertyName];
            if (tp == null) {
                throw new Error(`ConsumedThing '${this.title}' does not have property ${propertyName}`);
            }
            let { client, form } = this.getClientFor(tp.forms, "writeproperty", Affordance.PropertyAffordance, options);
            if (form == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable form`);
            }
            if (client == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable client for ${form.href}`);
            }
            debug(`ConsumedThing '${this.title}' writing ${form.href} with '${value}'`);
            const content = content_serdes_1.default.valueToContent(value, tp, form.contentType);
            form = this.handleUriVariables(tp, form, options);
            yield client.writeResource(form, content);
        });
    }
    writeMultipleProperties(valueMap, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (const propertyName in valueMap) {
                const value = valueMap.get(propertyName);
                promises.push(this.writeProperty(propertyName, value));
            }
            try {
                yield Promise.all(promises);
            }
            catch (err) {
                throw new Error(`ConsumedThing '${this.title}', failed to write multiple propertes: ${valueMap}\n Error: ${err}`);
            }
        });
    }
    invokeAction(actionName, parameter, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const ta = this.actions[actionName];
            if (ta == null) {
                throw new Error(`ConsumedThing '${this.title}' does not have action ${actionName}`);
            }
            let { client, form } = this.getClientFor(ta.forms, "invokeaction", Affordance.ActionAffordance, options);
            if (form == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable form`);
            }
            if (client == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable client for ${form.href}`);
            }
            debug(`ConsumedThing '${this.title}' invoking ${form.href}${parameter !== undefined ? " with '" + parameter + "'" : ""}`);
            let input;
            if (parameter !== undefined) {
                input = content_serdes_1.default.valueToContent(parameter, ta.input, form.contentType);
            }
            form = this.handleUriVariables(ta, form, options);
            const content = yield client.invokeResource(form, input);
            if (!content.type)
                content.type = (_a = form.contentType) !== null && _a !== void 0 ? _a : "application/json";
            if (form.response != null) {
                if (content.type !== form.response.contentType) {
                    throw new Error(`Unexpected type in response`);
                }
            }
            try {
                return new interaction_output_1.InteractionOutput(content, form, ta.output);
            }
            catch (_b) {
                throw new Error(`Received invalid content from Thing`);
            }
        });
    }
    observeProperty(name, listener, errorListener, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const tp = this.properties[name];
            if (tp == null) {
                throw new Error(`ConsumedThing '${this.title}' does not have property ${name}`);
            }
            const { client, form } = this.getClientFor(tp.forms, "observeproperty", Affordance.PropertyAffordance, options);
            if (form == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable form`);
            }
            if (client == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable client for ${form.href}`);
            }
            if (this.observedProperties.has(name)) {
                throw new Error(`ConsumedThing '${this.title}' has already a function subscribed to ${name}. You can only observe once`);
            }
            debug(`ConsumedThing '${this.title}' observing to ${form.href}`);
            const formWithoutURITemplates = this.handleUriVariables(tp, form, options);
            yield client.subscribeResource(formWithoutURITemplates, (content) => {
                var _a;
                if (!content.type)
                    content.type = (_a = form.contentType) !== null && _a !== void 0 ? _a : "application/json";
                try {
                    listener(new interaction_output_1.InteractionOutput(content, form, tp));
                }
                catch (e) {
                    warn(`Error while processing observe event for ${tp.title}`);
                    warn(e);
                }
            }, (err) => {
                errorListener === null || errorListener === void 0 ? void 0 : errorListener(err);
            }, () => {
            });
            const subscription = new InternalPropertySubscription(this, name, client, form);
            this.observedProperties.set(name, subscription);
            return subscription;
        });
    }
    subscribeEvent(name, listener, errorListener, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const te = this.events[name];
            if (te == null) {
                throw new Error(`ConsumedThing '${this.title}' does not have event ${name}`);
            }
            const { client, form } = this.getClientFor(te.forms, "subscribeevent", Affordance.EventAffordance, options);
            if (form == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable form`);
            }
            if (client == null) {
                throw new Error(`ConsumedThing '${this.title}' did not get suitable client for ${form.href}`);
            }
            if (this.subscribedEvents.has(name)) {
                throw new Error(`ConsumedThing '${this.title}' has already a function subscribed to ${name}. You can only subscribe once`);
            }
            debug(`ConsumedThing '${this.title}' subscribing to ${form.href}`);
            const formWithoutURITemplates = this.handleUriVariables(te, form, options);
            yield client.subscribeResource(formWithoutURITemplates, (content) => {
                var _a;
                if (!content.type)
                    content.type = (_a = form.contentType) !== null && _a !== void 0 ? _a : "application/json";
                try {
                    listener(new interaction_output_1.InteractionOutput(content, form, te.data));
                }
                catch (e) {
                    warn(`Error while processing event for ${te.title}`);
                    warn(e);
                }
            }, (err) => {
                errorListener === null || errorListener === void 0 ? void 0 : errorListener(err);
            }, () => {
            });
            const subscription = new InternalEventSubscription(this, name, client, form);
            this.subscribedEvents.set(name, subscription);
            return subscription;
        });
    }
    handleUriVariables(ti, form, options) {
        return handleUriVariables(this, ti, form, options);
    }
}
exports.default = ConsumedThing;
_ConsumedThing_servient = new WeakMap(), _ConsumedThing_clients = new WeakMap();
//# sourceMappingURL=consumed-thing.js.map