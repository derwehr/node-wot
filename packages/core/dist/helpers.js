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
const os = __importStar(require("os"));
const TD = __importStar(require("@node-wot/td-tools"));
const content_serdes_1 = require("./content-serdes");
const ajv_1 = __importDefault(require("ajv"));
const td_json_schema_validation_json_1 = __importDefault(require("wot-thing-description-types/schema/td-json-schema-validation.json"));
const td_tools_1 = require("@node-wot/td-tools");
const logger_1 = require("./logger");
const { debug, error, warn } = (0, logger_1.createLoggers)("core", "helpers");
const tdSchema = td_json_schema_validation_json_1.default;
const ajv = new ajv_1.default({ strict: false })
    .addFormat("iri-reference", /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i)
    .addFormat("uri", /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/)
    .addFormat("date-time", /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/);
class Helpers {
    constructor(srv) {
        this.srv = srv;
    }
    static extractScheme(uri) {
        const parsed = new URL(uri);
        debug(parsed);
        if (parsed.protocol === null) {
            throw new Error(`Protocol in url "${uri}" must be valid`);
        }
        const scheme = parsed.protocol.slice(0, -1);
        debug(`Helpers found scheme '${scheme}'`);
        return scheme;
    }
    static setStaticAddress(address) {
        Helpers.staticAddress = address;
    }
    static getAddresses() {
        var _a;
        const addresses = [];
        if (Helpers.staticAddress !== undefined) {
            addresses.push(Helpers.staticAddress);
            debug(`AddressHelper uses static ${addresses}`);
            return addresses;
        }
        else {
            const interfaces = os.networkInterfaces();
            for (const iface in interfaces) {
                (_a = interfaces[iface]) === null || _a === void 0 ? void 0 : _a.forEach((entry) => {
                    debug(`AddressHelper found ${entry.address}`);
                    if (entry.internal === false) {
                        if (entry.family === "IPv4") {
                            addresses.push(entry.address);
                        }
                        else if (entry.scopeid === 0) {
                            addresses.push(Helpers.toUriLiteral(entry.address));
                        }
                    }
                });
            }
            if (addresses.length === 0) {
                addresses.push("localhost");
            }
            debug(`AddressHelper identified ${addresses}`);
            return addresses;
        }
    }
    static toUriLiteral(address) {
        if (address == null) {
            error(`AddressHelper received invalid address '${address}'`);
            return "{invalid address - undefined}";
        }
        if (address.indexOf(":") !== -1) {
            address = `[${address}]`;
        }
        return address;
    }
    static generateUniqueName(name) {
        const suffix = name.match(/.+_([0-9]+)$/);
        if (suffix !== null) {
            return name.slice(0, -suffix[1].length) + (1 + parseInt(suffix[1]));
        }
        else {
            return name + "_2";
        }
    }
    static toStringArray(input) {
        if (input != null) {
            if (typeof input === "string") {
                return [input];
            }
            else {
                return input;
            }
        }
        else {
            return [];
        }
    }
    fetch(uri) {
        return new Promise((resolve, reject) => {
            const client = this.srv.getClientFor(Helpers.extractScheme(uri));
            debug(`WoTImpl fetching TD from '${uri}' with ${client}`);
            client
                .readResource(new TD.Form(uri, content_serdes_1.ContentSerdes.TD))
                .then((content) => __awaiter(this, void 0, void 0, function* () {
                if (content.type !== content_serdes_1.ContentSerdes.TD && content.type !== content_serdes_1.ContentSerdes.JSON_LD) {
                    warn(`WoTImpl received TD with media type '${content.type}' from ${uri}`);
                }
                const td = (yield content.toBuffer()).toString("utf-8");
                try {
                    const jo = JSON.parse(td);
                    resolve(jo);
                }
                catch (err) {
                    reject(new Error(`WoTImpl fetched invalid JSON from '${uri}': ${err instanceof Error ? err.message : err}`));
                }
            }))
                .then((td) => __awaiter(this, void 0, void 0, function* () {
                yield client.stop();
                return td;
            }))
                .catch((err) => {
                reject(err);
            });
        });
    }
    static extend(first, second) {
        const result = {};
        for (const id in first) {
            result[id] = first[id];
        }
        for (const id in second) {
            if (!Object.prototype.hasOwnProperty.call(result, id)) {
                result[id] = second[id];
            }
        }
        return result;
    }
    static parseInteractionOutput(response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield response.value();
            }
            catch (err) {
                error("parseInteractionOutput low-level stream not implemented");
                throw new Error("parseInteractionOutput low-level stream not implemented");
            }
        });
    }
    static createExposeThingInitSchema(tdSchema) {
        const tdSchemaCopy = structuredClone(tdSchema);
        if (tdSchemaCopy.required !== undefined) {
            const reservedKeywords = [
                "title",
                "@context",
                "instance",
                "forms",
                "security",
                "href",
                "securityDefinitions",
            ];
            if (Array.isArray(tdSchemaCopy.required)) {
                const reqProps = tdSchemaCopy.required;
                tdSchemaCopy.required = reqProps.filter((n) => !reservedKeywords.includes(n));
            }
            else if (typeof tdSchemaCopy.required === "string") {
                if (reservedKeywords.indexOf(tdSchemaCopy.required) !== -1)
                    delete tdSchemaCopy.required;
            }
        }
        if (tdSchemaCopy.definitions !== undefined) {
            for (const prop in tdSchemaCopy.definitions) {
                tdSchemaCopy.definitions[prop] = this.createExposeThingInitSchema(tdSchemaCopy.definitions[prop]);
            }
        }
        return tdSchemaCopy;
    }
    static validateExposedThingInit(data) {
        var _a;
        if (data["@type"] === "tm:ThingModel" || td_tools_1.ThingModelHelpers.isThingModel(data) === true) {
            return {
                valid: false,
                errors: "ThingModel declaration is not supported",
            };
        }
        const isValid = Helpers.tsSchemaValidator(data);
        let errors;
        if (!isValid) {
            errors = (_a = Helpers.tsSchemaValidator.errors) === null || _a === void 0 ? void 0 : _a.map((o) => o.message).join("\n");
        }
        return {
            valid: isValid,
            errors,
        };
    }
    static parseInteractionOptions(thing, ti, options) {
        var _a, _b;
        if (!this.validateInteractionOptions(thing, ti, options)) {
            throw new Error(`CoreHelpers one or more uriVariables were not found under neither '${ti.title}' Thing Interaction nor '${thing.title}' Thing`);
        }
        const interactionUriVariables = (_a = ti.uriVariables) !== null && _a !== void 0 ? _a : {};
        const thingUriVariables = (_b = thing.uriVariables) !== null && _b !== void 0 ? _b : {};
        const uriVariables = {};
        if (options === null || options === void 0 ? void 0 : options.uriVariables) {
            const entryVariables = Object.entries(options.uriVariables);
            entryVariables.forEach((entry) => {
                if (entry[0] in interactionUriVariables) {
                    uriVariables[entry[0]] = entry[1];
                }
                else if (entry[0] in thingUriVariables) {
                    uriVariables[entry[0]] = entry[1];
                }
            });
        }
        else {
            options = { uriVariables: {} };
        }
        for (const varKey in thingUriVariables) {
            const varValue = thingUriVariables[varKey];
            if (!(varKey in uriVariables) && "default" in varValue) {
                uriVariables[varKey] = varValue.default;
            }
        }
        options.uriVariables = uriVariables;
        return options;
    }
    static validateInteractionOptions(thing, ti, options) {
        var _a, _b;
        const interactionUriVariables = (_a = ti.uriVariables) !== null && _a !== void 0 ? _a : {};
        const thingUriVariables = (_b = thing.uriVariables) !== null && _b !== void 0 ? _b : {};
        if (options === null || options === void 0 ? void 0 : options.uriVariables) {
            const entryVariables = Object.entries(options.uriVariables);
            for (let i = 0; i < entryVariables.length; i++) {
                const entryVariable = entryVariables[i];
                if (!(entryVariable[0] in interactionUriVariables) && !(entryVariable[0] in thingUriVariables)) {
                    return false;
                }
            }
        }
        return true;
    }
    static parseUrlParameters(url, globalUriVariables = {}, uriVariables = {}) {
        const params = {};
        if (url == null || (uriVariables == null && globalUriVariables == null)) {
            return params;
        }
        const queryparams = url.split("?")[1];
        if (queryparams == null) {
            return params;
        }
        const queries = queryparams.indexOf("&") !== -1 ? queryparams.split("&") : [queryparams];
        queries.forEach((indexQuery) => {
            const indexPair = indexQuery.split("=");
            const queryKey = decodeURIComponent(indexPair[0]);
            const queryValue = decodeURIComponent(indexPair.length > 1 ? indexPair[1] : "");
            if (uriVariables != null && uriVariables[queryKey] != null) {
                if (uriVariables[queryKey].type === "integer" || uriVariables[queryKey].type === "number") {
                    params[queryKey] = +queryValue;
                }
                else {
                    params[queryKey] = queryValue;
                }
            }
            else if (globalUriVariables != null && globalUriVariables[queryKey] != null) {
                if (globalUriVariables[queryKey].type === "integer" || globalUriVariables[queryKey].type === "number") {
                    params[queryKey] = +queryValue;
                }
                else {
                    params[queryKey] = queryValue;
                }
            }
        });
        return params;
    }
    static updateInteractionNameWithUriVariablePattern(interactionName, affordanceUriVariables = {}, thingUriVariables = {}) {
        const encodedInteractionName = encodeURIComponent(interactionName);
        const uriVariables = [...Object.keys(affordanceUriVariables), ...Object.keys(thingUriVariables)];
        if (uriVariables.length === 0) {
            return encodedInteractionName;
        }
        const pattern = uriVariables.map(encodeURIComponent).join(",");
        return encodedInteractionName + "{?" + pattern + "}";
    }
}
exports.default = Helpers;
Helpers.tsSchemaValidator = ajv.compile(Helpers.createExposeThingInitSchema(tdSchema));
Helpers.staticAddress = undefined;
//# sourceMappingURL=helpers.js.map