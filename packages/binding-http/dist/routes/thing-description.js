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
const acceptLanguageParser = __importStar(require("accept-language-parser"));
const TD = __importStar(require("@node-wot/td-tools"));
const { debug } = (0, core_1.createLoggers)("binding-http", "routes", "thing-description");
function resetMultiLangInteraction(interactions, prefLang) {
    if (interactions) {
        for (const interName in interactions) {
            delete interactions[interName].title;
            delete interactions[interName].description;
            const titles = interactions[interName].titles;
            if (titles) {
                for (const titleLang in titles) {
                    if (titleLang.startsWith(prefLang)) {
                        interactions[interName].title = titles[titleLang];
                    }
                }
            }
            const descriptions = interactions[interName].descriptions;
            if (descriptions) {
                for (const descLang in descriptions) {
                    if (descLang.startsWith(prefLang)) {
                        interactions[interName].description = descriptions[descLang];
                    }
                }
            }
            delete interactions[interName].titles;
            delete interactions[interName].descriptions;
        }
    }
}
function resetMultiLangThing(thing, prefLang) {
    TD.setContextLanguage(thing, prefLang, true);
    if (thing.titles) {
        for (const titleLang in thing.titles) {
            if (titleLang.startsWith(prefLang)) {
                thing.title = thing.titles[titleLang];
            }
        }
    }
    if (thing.descriptions) {
        for (const titleLang in thing.descriptions) {
            if (titleLang.startsWith(prefLang)) {
                thing.description = thing.descriptions[titleLang];
            }
        }
    }
    delete thing.titles;
    delete thing.descriptions;
    resetMultiLangInteraction(thing.properties, prefLang);
    resetMultiLangInteraction(thing.actions, prefLang);
    resetMultiLangInteraction(thing.events, prefLang);
}
function negotiateLanguage(td, thing, req) {
    const acceptLanguage = req.headers["accept-language"];
    const noPreference = acceptLanguage == null || acceptLanguage === "*";
    if (noPreference) {
        return;
    }
    if (td.titles != null) {
        const supportedLanguages = Object.keys(td.titles);
        const prefLang = acceptLanguageParser.pick(supportedLanguages, acceptLanguage, {
            loose: true,
        });
        if (prefLang != null) {
            debug(`TD language negotiation through the Accept-Language header field of HTTP leads to "${prefLang}"`);
            resetMultiLangThing(td, prefLang);
        }
    }
}
function thingDescriptionRoute(req, res, _params) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (_params.thing === undefined) {
            res.writeHead(400);
            res.end();
            return;
        }
        const thing = this.getThings().get(_params.thing);
        if (thing == null) {
            res.writeHead(404);
            res.end();
            return;
        }
        const td = thing.getThingDescription();
        const contentSerdes = core_1.ContentSerdes.get();
        const acceptValues = (_b = (_a = req.headers.accept) === null || _a === void 0 ? void 0 : _a.split(",").map((acceptValue) => acceptValue.split(";")[0])) !== null && _b !== void 0 ? _b : [
            core_1.ContentSerdes.TD,
        ];
        const filteredAcceptValues = acceptValues
            .map((acceptValue) => {
            if (acceptValue === "*/*") {
                return core_1.ContentSerdes.TD;
            }
            return acceptValue;
        })
            .filter((acceptValue) => contentSerdes.isSupported(acceptValue))
            .sort((a, b) => {
            const aWeight = ["text/html", "application/json", "application/td+json"].findIndex((value) => value === a);
            const bWeight = ["text/html", "application/json", "application/td+json"].findIndex((value) => value === b);
            return bWeight - aWeight;
        });
        if (filteredAcceptValues.length > 0) {
            const contentType = filteredAcceptValues[0];
            const content = contentSerdes.valueToContent(td, undefined, contentType);
            const payload = yield content.toBuffer();
            negotiateLanguage(td, thing, req);
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Content-Type", contentType);
            res.writeHead(200);
            debug(`Sending HTTP response for TD with Content-Type ${contentType}.`);
            res.end(payload);
            return;
        }
        debug(`Request contained an accept header with the values ${acceptValues}, none of which are supported.`);
        res.writeHead(406);
        res.end(`Accept header contained no Content-Types supported by this resource. (Was ${acceptValues})`);
    });
}
exports.default = thingDescriptionRoute;
//# sourceMappingURL=thing-description.js.map