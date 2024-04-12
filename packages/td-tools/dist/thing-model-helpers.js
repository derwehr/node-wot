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
exports.ThingModelHelpers = void 0;
const ajv_1 = __importDefault(require("ajv"));
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const json_placeholder_replacer_1 = require("json-placeholder-replacer");
const tm_json_schema_validation_json_1 = __importDefault(require("wot-thing-model-types/schema/tm-json-schema-validation.json"));
const debug_1 = __importDefault(require("debug"));
const namespace = "node-wot:td-tools:thing-model-helpers";
const logDebug = (0, debug_1.default)(`${namespace}:debug`);
const logError = (0, debug_1.default)(`${namespace}:error`);
const tmSchema = tm_json_schema_validation_json_1.default;
const ajv = new ajv_1.default({ strict: false })
    .addFormat("iri-reference", /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i)
    .addFormat("uri-reference", /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i)
    .addFormat("uri", /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/)
    .addFormat("json-pointer", /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/)
    .addFormat("date-time", /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/);
class ThingModelHelpers {
    constructor(_resolver) {
        this.deps = [];
        this.resolver = undefined;
        if (_resolver) {
            this.resolver = _resolver;
        }
    }
    static isThingModel(_data) {
        if (_data === null || _data === undefined) {
            return false;
        }
        if (!(typeof _data === "object") || Array.isArray(_data)) {
            return false;
        }
        const data = _data;
        if (Array.isArray(data["@type"])) {
            const valid = data["@type"].filter((x) => x === "tm:ThingModel").length > 0;
            if (valid) {
                return true;
            }
        }
        else if (data["@type"] === "tm:ThingModel") {
            return true;
        }
        if (Object.keys(this.getThingModelRef(data)).length > 0) {
            return true;
        }
        if ("links" in data && Array.isArray(data.links)) {
            const foundTmExtendsRel = data.links.find((link) => link.rel === "tm:extends");
            if (foundTmExtendsRel != null)
                return true;
        }
        if (data.properties !== undefined) {
            if (this.isThingModel(data.properties))
                return true;
        }
        if (data.actions !== undefined) {
            if (this.isThingModel(data.actions))
                return true;
        }
        if (data.events !== undefined) {
            if (this.isThingModel(data.events))
                return true;
        }
        return false;
    }
    static getModelVersion(data) {
        var _a;
        return typeof (data === null || data === void 0 ? void 0 : data.version) === "object" && typeof ((_a = data === null || data === void 0 ? void 0 : data.version) === null || _a === void 0 ? void 0 : _a.model) === "string"
            ? data.version.model
            : undefined;
    }
    static validateThingModel(data) {
        var _a;
        const isValid = ThingModelHelpers.tsSchemaValidator(data);
        let errors;
        if (!isValid) {
            errors = (_a = ThingModelHelpers.tsSchemaValidator.errors) === null || _a === void 0 ? void 0 : _a.map((o) => o.message).join("\n");
        }
        return {
            valid: isValid,
            errors,
        };
    }
    getPartialTDs(model, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const extendedModels = yield this._getPartialTDs(model, options);
            const extendedPartialTDs = extendedModels.map((_data) => {
                const data = _data;
                if (data["@type"] instanceof Array) {
                    data["@type"] = data["@type"].map((el) => {
                        if (el === "tm:ThingModel") {
                            return "Thing";
                        }
                        return el;
                    });
                }
                else {
                    data["@type"] = "Thing";
                }
                return data;
            });
            return extendedPartialTDs;
        });
    }
    fetchModel(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            this.addDependency(uri);
            let tm;
            if (this.resolver) {
                tm = (yield this.resolver.fetch(uri));
            }
            else {
                tm = (yield this.localFetch(uri));
            }
            if (!ThingModelHelpers.isThingModel(tm)) {
                throw new Error(`Data at ${uri} is not a Thing Model`);
            }
            return tm;
        });
    }
    localFetch(uri) {
        const proto = uri.split("://")[0];
        switch (proto) {
            case "file": {
                const file = uri.split("://")[1];
                return new Promise((resolve, reject) => {
                    fs.readFile(file, { encoding: "utf-8" }, function (err, data) {
                        if (!err) {
                            resolve(JSON.parse(data));
                        }
                        else {
                            reject(err);
                        }
                    });
                });
            }
            case "http": {
                return new Promise((resolve, reject) => {
                    http.get(uri, (res) => {
                        if (res.statusCode == null || res.statusCode !== 200) {
                            reject(new Error(`http status code not 200 but ${res.statusCode} for ${uri}`));
                        }
                        res.setEncoding("utf8");
                        let rawData = "";
                        res.on("data", (chunk) => {
                            rawData += chunk;
                        });
                        res.on("end", () => {
                            try {
                                const parsedData = JSON.parse(rawData);
                                logDebug(`https fetched: ${parsedData}`);
                                resolve(parsedData);
                            }
                            catch (error) {
                                logError(error);
                            }
                        });
                    }).on("error", (e) => {
                        reject(e);
                    });
                });
            }
            case "https": {
                return new Promise((resolve, reject) => {
                    https
                        .get(uri, (res) => {
                        if (res.statusCode == null || res.statusCode !== 200) {
                            reject(new Error(`https status code not 200 but ${res.statusCode} for ${uri}`));
                        }
                        res.setEncoding("utf8");
                        let rawData = "";
                        res.on("data", (chunk) => {
                            rawData += chunk;
                        });
                        res.on("end", () => {
                            try {
                                const parsedData = JSON.parse(rawData);
                                logDebug(`https fetched: ${parsedData}`);
                                resolve(parsedData);
                            }
                            catch (error) {
                                logError(error);
                            }
                        });
                    })
                        .on("error", (e) => {
                        reject(e);
                    });
                });
            }
            default:
                break;
        }
        return null;
    }
    _getPartialTDs(model, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ThingModelHelpers.isThingModel(model)) {
                throw new Error(`${model} is not a Thing Model`);
            }
            let isValid = ThingModelHelpers.validateThingModel(model);
            if (isValid.valid === false || isValid.errors !== undefined) {
                throw new Error(isValid.errors);
            }
            isValid = this.checkPlaceholderMap(model, options === null || options === void 0 ? void 0 : options.map);
            if (isValid.valid === false || isValid.errors !== undefined) {
                throw new Error(isValid.errors);
            }
            const modelInput = yield this.fetchAffordances(model);
            const extendedModels = yield this.composeModel(model, modelInput, options);
            return extendedModels;
        });
    }
    fetchAffordances(data) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const modelInput = {};
            const extLinks = ThingModelHelpers.getThingModelLinks(data, "tm:extends");
            if (extLinks.length > 0) {
                modelInput.extends = [];
                for (const s of extLinks) {
                    let source = yield this.fetchModel(s.href);
                    [source] = yield this._getPartialTDs(source);
                    modelInput.extends.push(source);
                }
            }
            const affordanceTypes = ["properties", "actions", "events"];
            modelInput.imports = [];
            for (const affType of affordanceTypes) {
                const affRefs = ThingModelHelpers.getThingModelRef(data[affType]);
                if (Object.keys(affRefs).length > 0) {
                    for (const aff in affRefs) {
                        const affUri = affRefs[aff];
                        const refObj = this.parseTmRef(affUri);
                        if (refObj.uri == null) {
                            throw new Error(`Missing remote path in ${affUri}`);
                        }
                        let source = yield this.fetchModel(refObj.uri);
                        [source] = yield this._getPartialTDs(source);
                        delete data[affType][aff]["tm:ref"];
                        const importedAffordance = (_a = this.getRefAffordance(refObj, source)) !== null && _a !== void 0 ? _a : {};
                        refObj.name = aff;
                        modelInput.imports.push(Object.assign({ affordance: importedAffordance }, refObj));
                    }
                }
            }
            const tmLinks = ThingModelHelpers.getThingModelLinks(data, "tm:submodel");
            if (tmLinks.length > 0) {
                modelInput.submodel = {};
                for (const l of tmLinks) {
                    const submodel = yield this.fetchModel(l.href);
                    modelInput.submodel[l.href] = submodel;
                }
            }
            return modelInput;
        });
    }
    composeModel(data, modelObject, options) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            let tmpThingModels = [];
            const title = ((_a = data.title) !== null && _a !== void 0 ? _a : "").replace(/ /g, "");
            if (!options) {
                options = {};
            }
            if (options.baseUrl == null) {
                options.baseUrl = ".";
            }
            const newTMHref = this.returnNewTMHref(options.baseUrl, title);
            const newTDHref = this.returnNewTDHref(options.baseUrl, title);
            if ("extends" in modelObject) {
                const extendObjs = (_b = modelObject.extends) !== null && _b !== void 0 ? _b : [];
                for (const extendObj of extendObjs) {
                    data = ThingModelHelpers.extendThingModel(extendObj, data);
                }
                data.links = (_c = data.links) === null || _c === void 0 ? void 0 : _c.filter((link) => link.rel !== "tm:extends");
            }
            if ("imports" in modelObject) {
                const importObjs = (_d = modelObject.imports) !== null && _d !== void 0 ? _d : [];
                for (const importedObj of importObjs) {
                    data = ThingModelHelpers.importAffordance(importedObj.type, importedObj.name, importedObj.affordance, data);
                }
            }
            if ("submodel" in modelObject) {
                const submodelObj = modelObject.submodel;
                for (const key in submodelObj) {
                    const sub = submodelObj[key];
                    if (options.selfComposition === true) {
                        if (!data.links) {
                            throw new Error("You used self composition but links are missing; they are needed to extract the instance name");
                        }
                        const index = data.links.findIndex((el) => el.href === key);
                        const el = data.links[index];
                        const instanceName = el.instanceName;
                        if (instanceName == null) {
                            throw new Error("Self composition is not possible without instance names");
                        }
                        const [subPartialTD] = yield this._getPartialTDs(sub, options);
                        const affordanceTypes = ["properties", "actions", "events"];
                        for (const affType of affordanceTypes) {
                            for (const affKey in subPartialTD[affType]) {
                                const newAffKey = `${instanceName}_${affKey}`;
                                if (!(affType in data)) {
                                    data[affType] = {};
                                }
                                data[affType][newAffKey] = subPartialTD[affType][affKey];
                            }
                        }
                    }
                    else {
                        const subTitle = ((_e = sub.title) !== null && _e !== void 0 ? _e : "").replace(/ /g, "");
                        const subNewHref = this.returnNewTDHref(options.baseUrl, subTitle);
                        if (!sub.links) {
                            sub.links = [];
                        }
                        sub.links.push({
                            rel: "collection",
                            href: newTDHref,
                            type: "application/td+json",
                        });
                        const tmpPartialSubTDs = yield this._getPartialTDs(sub, options);
                        tmpThingModels.push(...tmpPartialSubTDs);
                        data = ThingModelHelpers.formatSubmodelLink(data, key, subNewHref);
                    }
                }
            }
            if (!data.links || options.selfComposition === true) {
                data.links = [];
            }
            data.links.push({
                rel: "type",
                href: newTMHref,
                type: "application/tm+json",
            });
            if ("version" in data) {
                delete data.version;
            }
            if (options.map) {
                data = this.fillPlaceholder(data, options.map);
            }
            tmpThingModels.unshift(data);
            tmpThingModels = tmpThingModels.map((el) => this.fillPlaceholder(el, options === null || options === void 0 ? void 0 : options.map));
            if (this.deps.length > 0) {
                this.removeDependency();
            }
            return tmpThingModels;
        });
    }
    static getThingModelRef(data) {
        const refs = {};
        if (data == null) {
            return refs;
        }
        for (const key in data) {
            for (const key1 in data[key]) {
                if (key1 === "tm:ref") {
                    refs[key] = data[key]["tm:ref"];
                }
            }
        }
        return refs;
    }
    static getThingModelLinks(data, type) {
        let links = [];
        if ("links" in data && Array.isArray(data.links)) {
            links = data.links;
        }
        return links.filter((el) => el.rel === type);
    }
    static extendThingModel(source, dest) {
        let extendedModel = {};
        const properties = source.properties;
        const actions = source.actions;
        const events = source.events;
        extendedModel = Object.assign(Object.assign({}, source), dest);
        if (properties) {
            if (!extendedModel.properties) {
                extendedModel.properties = {};
            }
            for (const key in properties) {
                if (dest.properties && dest.properties[key] != null) {
                    extendedModel.properties[key] = Object.assign(Object.assign({}, properties[key]), dest.properties[key]);
                }
                else {
                    extendedModel.properties[key] = properties[key];
                }
            }
        }
        if (actions) {
            if (!extendedModel.actions) {
                extendedModel.actions = {};
            }
            for (const key in actions) {
                if (dest.actions && key in dest.actions) {
                    extendedModel.actions[key] = Object.assign(Object.assign({}, actions[key]), dest.actions[key]);
                }
                else {
                    extendedModel.actions[key] = actions[key];
                }
            }
        }
        if (events) {
            if (!extendedModel.events) {
                extendedModel.events = {};
            }
            for (const key in events) {
                if (dest.events && key in dest.events) {
                    extendedModel.events[key] = Object.assign(Object.assign({}, events[key]), dest.events[key]);
                }
                else {
                    extendedModel.events[key] = events[key];
                }
            }
        }
        return extendedModel;
    }
    static importAffordance(affordanceType, affordanceName, source, dest) {
        if (!dest[affordanceType]) {
            dest[affordanceType] = {};
        }
        const d = dest[affordanceType][affordanceName];
        dest[affordanceType][affordanceName] = Object.assign(Object.assign({}, source), d);
        for (const key in dest[affordanceType][affordanceName]) {
            if (dest[affordanceType][affordanceName][key] === undefined) {
                delete dest[affordanceType][affordanceName][key];
            }
        }
        return dest;
    }
    static formatSubmodelLink(source, oldHref, newHref) {
        if (!source.links) {
            throw new Error("Links are missing");
        }
        const index = source.links.findIndex((el) => el.href === oldHref);
        if (index === -1) {
            throw new Error("Link not found");
        }
        const el = source.links[index];
        if ("instanceName" in el) {
            delete el.instanceName;
        }
        source.links[index] = Object.assign(Object.assign({}, el), { href: newHref, type: "application/td+json", rel: "item" });
        return source;
    }
    parseTmRef(value) {
        const thingModelUri = value.split("#")[0];
        const affordaceUri = value.split("#")[1];
        const affordaceType = affordaceUri.split("/")[1];
        const affordaceName = affordaceUri.split("/")[2];
        return { uri: thingModelUri, type: affordaceType, name: affordaceName };
    }
    getRefAffordance(obj, thing) {
        const affordanceType = obj.type;
        const affordanceKey = obj.name;
        if (!(affordanceType in thing)) {
            return undefined;
        }
        const affordances = thing[affordanceType];
        if (!(affordanceKey in affordances)) {
            return undefined;
        }
        return affordances[affordanceKey];
    }
    fillPlaceholder(data, map = {}) {
        const placeHolderReplacer = new json_placeholder_replacer_1.JsonPlaceholderReplacer();
        placeHolderReplacer.addVariableMap(map);
        return placeHolderReplacer.replace(data);
    }
    checkPlaceholderMap(model, map = {}) {
        var _a;
        const regex = "{{.*?}}";
        const modelString = JSON.stringify(model);
        let keys = (_a = modelString.match(new RegExp(regex, "g"))) !== null && _a !== void 0 ? _a : [];
        keys = keys.map((el) => el.replace("{{", "").replace("}}", ""));
        let isValid = true;
        let errors;
        if ((keys === null || keys === void 0 ? void 0 : keys.length) > 0 && (map === undefined || map === null)) {
            isValid = false;
            errors = `No map provided for model ${model.title}`;
        }
        else if (keys.length > 0) {
            keys.every((key) => {
                if (!(key in map)) {
                    errors = `Missing required fields in map for model ${model.title}`;
                    isValid = false;
                    return false;
                }
                return true;
            });
        }
        return {
            valid: isValid,
            errors,
        };
    }
    returnNewTMHref(baseUrl, tdname) {
        return `${baseUrl}/${tdname}.tm.jsonld`;
    }
    returnNewTDHref(baseUrl, tdname) {
        return `${baseUrl}/${tdname}.td.jsonld`;
    }
    addDependency(dep) {
        if (this.deps.indexOf(dep) > -1) {
            throw new Error(`Circular dependency found for ${dep}`);
        }
        this.deps.push(dep);
    }
    removeDependency(dep) {
        if (dep != null) {
            this.deps = this.deps.filter((el) => el !== dep);
        }
        else {
            this.deps.pop();
        }
    }
}
exports.ThingModelHelpers = ThingModelHelpers;
ThingModelHelpers.tsSchemaValidator = ajv.compile(tmSchema);
//# sourceMappingURL=thing-model-helpers.js.map