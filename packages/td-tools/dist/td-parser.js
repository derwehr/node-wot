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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeTD = exports.parseTD = void 0;
const TD = __importStar(require("./thing-description"));
const TDHelpers = __importStar(require("./td-helpers"));
const isAbsoluteUrl = require("is-absolute-url");
const URLToolkit = require("url-toolkit");
const debug_1 = __importDefault(require("debug"));
const namespace = "node-wot:td-tools:td-parser";
const logDebug = (0, debug_1.default)(`${namespace}:debug`);
const logWarn = (0, debug_1.default)(`${namespace}:warn`);
function parseTD(td, normalize) {
    logDebug(`parseTD() parsing\n\`\`\`\n${td}\n\`\`\``);
    const thing = JSON.parse(td.replace(/^\uFEFF/, ""));
    if (thing["@context"] === undefined) {
        thing["@context"] = [TD.DEFAULT_CONTEXT_V1, TD.DEFAULT_CONTEXT_V11];
    }
    else if (Array.isArray(thing["@context"])) {
        let semContext = thing["@context"];
        const indexV1 = semContext.indexOf(TD.DEFAULT_CONTEXT_V1);
        const indexV11 = semContext.indexOf(TD.DEFAULT_CONTEXT_V11);
        if (indexV1 === -1 && indexV11 === -1) {
            semContext.unshift(TD.DEFAULT_CONTEXT_V11);
            semContext.unshift(TD.DEFAULT_CONTEXT_V1);
        }
        else {
            if (indexV1 !== -1 && indexV11 !== -1) {
                semContext = semContext.filter(function (e) {
                    return e !== TD.DEFAULT_CONTEXT_V1;
                });
                semContext = semContext.filter(function (e) {
                    return e !== TD.DEFAULT_CONTEXT_V11;
                });
                semContext.unshift(TD.DEFAULT_CONTEXT_V11);
                semContext.unshift(TD.DEFAULT_CONTEXT_V1);
            }
            else {
                if (indexV1 !== -1 && indexV1 !== 0) {
                    semContext = semContext.filter(function (e) {
                        return e !== TD.DEFAULT_CONTEXT_V1;
                    });
                    semContext.unshift(TD.DEFAULT_CONTEXT_V1);
                }
                if (indexV11 !== -1 && indexV11 !== 0) {
                    semContext = semContext.filter(function (e) {
                        return e !== TD.DEFAULT_CONTEXT_V11;
                    });
                    semContext.unshift(TD.DEFAULT_CONTEXT_V11);
                }
            }
            thing["@context"] = semContext;
        }
    }
    else if (thing["@context"] !== TD.DEFAULT_CONTEXT_V1 && thing["@context"] !== TD.DEFAULT_CONTEXT_V11) {
        const semContext = thing["@context"];
        thing["@context"] = [TD.DEFAULT_CONTEXT_V1, TD.DEFAULT_CONTEXT_V11, semContext];
    }
    TDHelpers.setContextLanguage(thing, TD.DEFAULT_CONTEXT_LANGUAGE, false);
    if (thing["@type"] === undefined) {
        thing["@type"] = TD.DEFAULT_THING_TYPE;
    }
    else if (Array.isArray(thing["@type"])) {
        const semTypes = thing["@type"];
        if (semTypes.indexOf(TD.DEFAULT_THING_TYPE) === -1) {
            semTypes.unshift(TD.DEFAULT_THING_TYPE);
        }
    }
    else if (thing["@type"] !== TD.DEFAULT_THING_TYPE) {
        const semType = thing["@type"];
        thing["@type"] = [TD.DEFAULT_THING_TYPE, semType];
    }
    if (thing.properties !== undefined && thing.properties instanceof Object) {
        for (const propName in thing.properties) {
            const prop = thing.properties[propName];
            if (prop.readOnly === undefined || typeof prop.readOnly !== "boolean") {
                prop.readOnly = false;
            }
            if (prop.writeOnly === undefined || typeof prop.writeOnly !== "boolean") {
                prop.writeOnly = false;
            }
            if (prop.observable === undefined || typeof prop.observable !== "boolean") {
                prop.observable = false;
            }
        }
    }
    if (thing.actions !== undefined && thing.actions instanceof Object) {
        for (const actName in thing.actions) {
            const act = thing.actions[actName];
            if (act.safe === undefined || typeof act.safe !== "boolean") {
                act.safe = false;
            }
            if (act.idempotent === undefined || typeof act.idempotent !== "boolean") {
                act.idempotent = false;
            }
        }
    }
    if (typeof thing.properties !== "object" || thing.properties === null) {
        thing.properties = {};
    }
    if (typeof thing.actions !== "object" || thing.actions === null) {
        thing.actions = {};
    }
    if (typeof thing.events !== "object" || thing.events === null) {
        thing.events = {};
    }
    if (thing.security === undefined) {
        logWarn("parseTD() found no security metadata");
    }
    if (typeof thing.security === "string") {
        thing.security = [thing.security];
    }
    const allForms = [];
    for (const propName in thing.properties) {
        const prop = thing.properties[propName];
        if (!prop.forms) {
            throw new Error(`Property '${propName}' has no forms field`);
        }
        for (const form of prop.forms) {
            if (!form.href) {
                throw new Error(`Form of Property '${propName}' has no href field`);
            }
            if (!isAbsoluteUrl(form.href) && thing.base == null)
                throw new Error(`Form of Property '${propName}' has relative URI while TD has no base field`);
            allForms.push(form);
        }
    }
    for (const actName in thing.actions) {
        const act = thing.actions[actName];
        if (!act.forms) {
            throw new Error(`Action '${actName}' has no forms field`);
        }
        for (const form of act.forms) {
            if (!form.href) {
                throw new Error(`Form of Action '${actName}' has no href field`);
            }
            if (!isAbsoluteUrl(form.href) && thing.base == null)
                throw new Error(`Form of Action '${actName}' has relative URI while TD has no base field`);
            allForms.push(form);
        }
    }
    for (const evtName in thing.events) {
        const evt = thing.events[evtName];
        if (!evt.forms) {
            throw new Error(`Event '${evtName}' has no forms field`);
        }
        for (const form of evt.forms) {
            if (!form.href) {
                throw new Error(`Form of Event '${evtName}' has no href field`);
            }
            if (!isAbsoluteUrl(form.href) && thing.base == null)
                throw new Error(`Form of Event '${evtName}' has relative URI while TD has no base field`);
            allForms.push(form);
        }
    }
    if (Object.prototype.hasOwnProperty.call(thing, "base")) {
        if (normalize === undefined || normalize === true) {
            logDebug("parseTD() normalizing 'base' into 'forms'");
            for (const form of allForms) {
                if (!form.href.match(/^([a-z0-9+-.]+:).+/i)) {
                    logDebug(`parseTDString() applying base '${thing.base}' to '${form.href}'`);
                    form.href = URLToolkit.buildAbsoluteURL(thing.base, form.href);
                }
            }
        }
    }
    return thing;
}
exports.parseTD = parseTD;
function serializeTD(thing) {
    var _a;
    const copy = JSON.parse(JSON.stringify(thing));
    if (copy.security == null || copy.security.length === 0) {
        copy.securityDefinitions = {
            nosec_sc: { scheme: "nosec" },
        };
        copy.security = ["nosec_sc"];
    }
    if (((_a = copy.forms) === null || _a === void 0 ? void 0 : _a.length) === 0) {
        delete copy.forms;
    }
    if (copy.properties != null && Object.keys(copy.properties).length === 0) {
        delete copy.properties;
    }
    else if (copy.properties != null) {
        for (const propName in copy.properties) {
            const prop = copy.properties[propName];
            if (prop.readOnly === undefined || typeof prop.readOnly !== "boolean") {
                prop.readOnly = false;
            }
            if (prop.writeOnly === undefined || typeof prop.writeOnly !== "boolean") {
                prop.writeOnly = false;
            }
            if (prop.observable === undefined || typeof prop.observable !== "boolean") {
                prop.observable = false;
            }
        }
    }
    if (copy.actions != null && Object.keys(copy.actions).length === 0) {
        delete copy.actions;
    }
    else if (copy.actions != null) {
        for (const actName in copy.actions) {
            const act = copy.actions[actName];
            if (act.idempotent === undefined || typeof act.idempotent !== "boolean") {
                act.idempotent = false;
            }
            if (act.safe === undefined || typeof act.safe !== "boolean") {
                act.safe = false;
            }
        }
    }
    if (copy.events != null && Object.keys(copy.events).length === 0) {
        delete copy.events;
    }
    if ((copy === null || copy === void 0 ? void 0 : copy.links.length) === 0) {
        delete copy.links;
    }
    const td = JSON.stringify(copy);
    return td;
}
exports.serializeTD = serializeTD;
//# sourceMappingURL=td-parser.js.map