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
exports.AssetInterfaceDescriptionUtil = void 0;
const TDParser = __importStar(require("../td-parser"));
const debug_1 = __importDefault(require("debug"));
const isAbsoluteUrl = require("is-absolute-url");
const URLToolkit = require("url-toolkit");
const namespace = "node-wot:td-tools:asset-interface-description-util";
const logDebug = (0, debug_1.default)(`${namespace}:debug`);
const logInfo = (0, debug_1.default)(`${namespace}:info`);
const logError = (0, debug_1.default)(`${namespace}:error`);
class AssetInterfaceDescriptionUtil {
    transformAAS2TD(aas, template, submodelRegex) {
        const smInformation = this.getSubmodelInformation(aas, submodelRegex);
        return this._transform(smInformation, template);
    }
    transformSM2TD(aid, template, submodelRegex) {
        const submodel = JSON.parse(aid);
        const smInformation = {
            actions: new Map(),
            events: new Map(),
            properties: new Map(),
            endpointMetadataArray: [],
            thing: new Map(),
        };
        this.processSubmodel(smInformation, submodel, submodelRegex);
        return this._transform(smInformation, template);
    }
    transformTD2AAS(td, protocols) {
        const submodel = this.transformTD2SM(td, protocols);
        const submodelObj = JSON.parse(submodel);
        const submodelId = submodelObj.id;
        const aasName = "SampleAAS";
        const aasId = "https://example.com/ids/aas/7474_9002_6022_1115";
        const aas = {
            assetAdministrationShells: [
                {
                    idShort: this.sanitizeIdShort(aasName),
                    id: aasId,
                    assetInformation: {
                        assetKind: "Type",
                    },
                    submodels: [
                        {
                            type: "ModelReference",
                            keys: [
                                {
                                    type: "Submodel",
                                    value: submodelId,
                                },
                            ],
                        },
                    ],
                    modelType: "AssetAdministrationShell",
                },
            ],
            submodels: [submodelObj],
            conceptDescriptions: [],
        };
        return JSON.stringify(aas);
    }
    transformTD2SM(tdAsString, protocols) {
        var _a;
        const td = TDParser.parseTD(tdAsString);
        const aidID = (_a = td.id) !== null && _a !== void 0 ? _a : "ID" + Math.random();
        logInfo("TD " + td.title + " parsed...");
        if (protocols === undefined || protocols.length === 0) {
            protocols = this.getProtocolPrefixes(td);
        }
        const submdelElements = [];
        for (const protocol of protocols) {
            const submodelElementIdShort = this.sanitizeIdShort(protocol === undefined ? "Interface" : "Interface" + protocol.toUpperCase());
            const supplementalSemanticIds = [this.createSemanticId("https://www.w3.org/2019/wot/td")];
            if (protocol !== undefined) {
                const protocolLC = protocol.toLocaleLowerCase();
                let supplementalSemanticIdProtocolValue;
                if (protocolLC.includes("modbus")) {
                    supplementalSemanticIdProtocolValue = "http://www.w3.org/2011/modbus";
                }
                else if (protocolLC.includes("mqtt")) {
                    supplementalSemanticIdProtocolValue = "http://www.w3.org/2011/mqtt";
                }
                else if (protocolLC.includes("http")) {
                    supplementalSemanticIdProtocolValue = "http://www.w3.org/2011/http";
                }
                if (supplementalSemanticIdProtocolValue !== undefined) {
                    supplementalSemanticIds.push(this.createSemanticId(supplementalSemanticIdProtocolValue));
                }
            }
            const submdelElement = {
                idShort: submodelElementIdShort,
                semanticId: this.createSemanticId("https://admin-shell.io/idta/AssetInterfacesDescription/1/0/Interface"),
                supplementalSemanticIds,
                value: [
                    {
                        idShort: "title",
                        valueType: "xs:string",
                        value: td.title,
                        modelType: "Property",
                        semanticId: this.createSemanticId("https://www.w3.org/2019/wot/td#title"),
                    },
                    this.createEndpointMetadata(td, protocol, aidID, submodelElementIdShort),
                    this.createInterfaceMetadata(td, protocol),
                ],
                modelType: "SubmodelElementCollection",
            };
            submdelElements.push(submdelElement);
        }
        const aidObject = {
            idShort: "AssetInterfacesDescription",
            id: aidID,
            kind: "Instance",
            semanticId: this.createSemanticId("https://admin-shell.io/idta/AssetInterfacesDescription/1/0/Submodel"),
            description: [
                {
                    language: "en",
                    text: td.title,
                },
            ],
            submodelElements: submdelElements,
            modelType: "Submodel",
        };
        return JSON.stringify(aidObject);
    }
    transformToTD(aid, template, submodelRegex) {
        return this.transformAAS2TD(aid, template, submodelRegex);
    }
    createSemanticId(value) {
        return {
            type: "ExternalReference",
            keys: [
                {
                    type: "GlobalReference",
                    value,
                },
            ],
        };
    }
    replaceCharAt(str, index, char) {
        if (index > str.length - 1)
            return str;
        return str.substring(0, index) + char + str.substring(index + 1);
    }
    sanitizeIdShort(value) {
        if (value != null) {
            for (let i = 0; i < value.length; i++) {
                const char = value.charCodeAt(i);
                if (i !== 0 && char === " ".charCodeAt(0)) {
                }
                else if (char >= "0".charCodeAt(0) && char <= "9".charCodeAt(0)) {
                }
                else if (char >= "A".charCodeAt(0) && char <= "Z".charCodeAt(0)) {
                }
                else if (char >= "a".charCodeAt(0) && char <= "z".charCodeAt(0)) {
                }
                else {
                    value = this.replaceCharAt(value, i, "_");
                }
            }
        }
        return value;
    }
    getSimpleValueTypeXsd(value) {
        if (typeof value === "boolean") {
            return "xs:boolean";
        }
        else if (typeof value === "number") {
            const number = Number(value);
            if (Number.isInteger(number)) {
                if (number <= 2147483647 && number >= -2147483648) {
                    return "xs:int";
                }
                else {
                    return "xs:integer";
                }
            }
            else {
                return "xs:double";
            }
        }
        else {
            return "xs:string";
        }
    }
    getProtocolPrefixes(td) {
        const protocols = [];
        if (td.properties) {
            for (const propertyKey in td.properties) {
                const property = td.properties[propertyKey];
                this.updateProtocolPrefixes(property.forms, protocols);
            }
        }
        if (td.actions) {
            for (const actionKey in td.actions) {
                const action = td.actions[actionKey];
                this.updateProtocolPrefixes(action.forms, protocols);
            }
        }
        if (td.events) {
            for (const eventKey in td.events) {
                const event = td.events[eventKey];
                this.updateProtocolPrefixes(event.forms, protocols);
            }
        }
        return protocols;
    }
    updateProtocolPrefixes(forms, protocols) {
        if (forms != null) {
            for (const interactionForm of forms) {
                if (interactionForm.href != null) {
                    const positionColon = interactionForm.href.indexOf(":");
                    if (positionColon > 0) {
                        const prefix = interactionForm.href.substring(0, positionColon);
                        if (!protocols.includes(prefix)) {
                            protocols.push(prefix);
                        }
                    }
                }
            }
        }
    }
    getBaseFromEndpointMetadata(endpointMetadata) {
        if ((endpointMetadata === null || endpointMetadata === void 0 ? void 0 : endpointMetadata.value) instanceof Array) {
            for (const v of endpointMetadata.value) {
                if (v.idShort === "base") {
                    return v.value;
                }
            }
        }
        return "undefined";
    }
    getContentTypeFromEndpointMetadata(endpointMetadata) {
        if ((endpointMetadata === null || endpointMetadata === void 0 ? void 0 : endpointMetadata.value) instanceof Array) {
            for (const v of endpointMetadata.value) {
                if (v.idShort === "contentType") {
                    return v.value;
                }
            }
        }
        return "";
    }
    updateRootMetadata(thing, endpointMetadata) {
        const securityDefinitions = {};
        const security = [];
        if ((endpointMetadata === null || endpointMetadata === void 0 ? void 0 : endpointMetadata.value) instanceof Array) {
            for (const v of endpointMetadata.value) {
                if (v.idShort === "base") {
                    thing.base = v.value;
                }
                else if (v.idShort === "securityDefinitions") {
                    if (v.value instanceof Array) {
                        for (const securityDefinitionsValues of v.value) {
                            if (securityDefinitionsValues.idShort != null) {
                                if (securityDefinitionsValues.value instanceof Array) {
                                    for (const securityDefinitionsValue of securityDefinitionsValues.value) {
                                        if (securityDefinitionsValue.idShort === "scheme") {
                                            if (securityDefinitionsValue.value != null) {
                                                const ss = { scheme: securityDefinitionsValue.value };
                                                securityDefinitions[securityDefinitionsValues.idShort] = ss;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else if (v.idShort === "security") {
                    if (v.value instanceof Array) {
                        for (const securityValue of v.value) {
                            if (securityValue.value != null && securityValue.value.keys instanceof Array) {
                                const key = securityValue.value.keys[securityValue.value.keys.length - 1];
                                if (key.value != null) {
                                    security.push(key.value);
                                }
                            }
                        }
                    }
                }
            }
        }
        thing.securityDefinitions = securityDefinitions;
        thing.security = security;
    }
    createInteractionForm(vi, addSecurity) {
        const form = {
            href: this.getBaseFromEndpointMetadata(vi.endpointMetadata),
            contentType: this.getContentTypeFromEndpointMetadata(vi.endpointMetadata),
        };
        if (addSecurity) {
            logError("security at form level not added/present");
        }
        if (vi.interaction.value instanceof Array) {
            for (const iv of vi.interaction.value) {
                if (iv.idShort === "forms") {
                    if (iv.value instanceof Array) {
                        for (const v of iv.value) {
                            if (v.idShort === "href") {
                                if (v.value != null) {
                                    const hrefValue = v.value;
                                    if (isAbsoluteUrl(hrefValue)) {
                                        form.href = hrefValue;
                                    }
                                    else if (form.href && form.href.length > 0) {
                                        if (form.href.endsWith("/") && hrefValue.startsWith("/")) {
                                            form.href = form.href + hrefValue.substring(1);
                                        }
                                        else if (!form.href.endsWith("/") && !hrefValue.startsWith("/")) {
                                            form.href = form.href + "/" + hrefValue;
                                        }
                                        else {
                                            form.href = form.href + hrefValue;
                                        }
                                    }
                                    else {
                                        form.href = hrefValue;
                                    }
                                }
                            }
                            else if (typeof v.idShort === "string" && v.idShort.length > 0) {
                                if (v.value != null) {
                                    const tdTerm = v.idShort.replace("_", ":");
                                    form[tdTerm] = v.value;
                                    if (v.valueType != null &&
                                        v.valueType.dataObjectType != null &&
                                        v.valueType.dataObjectType.name != null &&
                                        typeof v.valueType.dataObjectType.name === "string") {
                                        switch (v.valueType.dataObjectType.name) {
                                            case "boolean":
                                                form[tdTerm] = form[v.value] === "true";
                                                break;
                                            case "float":
                                            case "double":
                                            case "decimal":
                                            case "integer":
                                            case "nonPositiveInteger":
                                            case "negativeInteger":
                                            case "long":
                                            case "int":
                                            case "short":
                                            case "byte":
                                            case "nonNegativeInteger":
                                            case "unsignedLong":
                                            case "unsignedInt":
                                            case "unsignedShort":
                                            case "unsignedByte":
                                            case "positiveInteger":
                                                form[tdTerm] = Number(form[v.value]);
                                                break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return form;
    }
    processSubmodel(smInformation, submodel, submodelRegex) {
        if (submodel instanceof Object &&
            submodel.idShort != null &&
            submodel.idShort === "AssetInterfacesDescription") {
            if (submodel.submodelElements instanceof Array) {
                for (const submodelElement of submodel.submodelElements) {
                    if (submodelElement instanceof Object) {
                        logDebug("SubmodelElement.idShort: " + submodelElement.idShort);
                        if (typeof submodelRegex === "string" && submodelRegex.length > 0) {
                            const regex = new RegExp(submodelRegex);
                            if (!regex.test(submodelElement.idShort)) {
                                logInfo("submodel not of interest");
                                continue;
                            }
                        }
                        this.processSubmodelElement(smInformation, submodelElement);
                    }
                }
            }
        }
    }
    processSubmodelElement(smInformation, submodelElement) {
        var _a, _b, _c;
        if (submodelElement.value instanceof Array) {
            let endpointMetadata = {};
            for (const smValue of submodelElement.value) {
                if (smValue instanceof Object) {
                    if (smValue.idShort === "EndpointMetadata") {
                        logInfo("EndpointMetadata");
                        endpointMetadata = smValue;
                        smInformation.endpointMetadataArray.push(endpointMetadata);
                    }
                    else if (smValue.idShort === "InterfaceMetadata") {
                    }
                    else if (smValue.idShort === "externalDescriptor") {
                    }
                    else {
                        smInformation.thing.set(smValue.idShort, smValue.value);
                    }
                }
            }
            for (const smValue of submodelElement.value) {
                if (smValue instanceof Object) {
                    if (smValue.idShort === "InterfaceMetadata") {
                        logInfo("InterfaceMetadata");
                        if (smValue.value instanceof Array) {
                            for (const interactionValue of smValue.value) {
                                if (interactionValue.idShort === "properties") {
                                    if (interactionValue.value instanceof Array) {
                                        for (const iValue of interactionValue.value) {
                                            logInfo("Property: " + iValue.idShort);
                                            if (!smInformation.properties.has(iValue.idShort)) {
                                                smInformation.properties.set(iValue.idShort, []);
                                            }
                                            const propInter = {
                                                endpointMetadata,
                                                interaction: iValue,
                                            };
                                            (_a = smInformation.properties.get(iValue.idShort)) === null || _a === void 0 ? void 0 : _a.push(propInter);
                                        }
                                    }
                                }
                                else if (interactionValue.idShort === "actions") {
                                    if (interactionValue.value instanceof Array) {
                                        for (const iValue of interactionValue.value) {
                                            logInfo("Action: " + iValue.idShort);
                                            if (!smInformation.actions.has(iValue.idShort)) {
                                                smInformation.actions.set(iValue.idShort, []);
                                            }
                                            const actInter = {
                                                endpointMetadata,
                                                interaction: iValue,
                                            };
                                            (_b = smInformation.actions.get(iValue.idShort)) === null || _b === void 0 ? void 0 : _b.push(actInter);
                                        }
                                    }
                                }
                                else if (interactionValue.idShort === "events") {
                                    if (interactionValue.value instanceof Array) {
                                        for (const iValue of interactionValue.value) {
                                            logInfo("Event: " + iValue.idShort);
                                            if (!smInformation.events.has(iValue.idShort)) {
                                                smInformation.events.set(iValue.idShort, []);
                                            }
                                            const evInter = {
                                                endpointMetadata,
                                                interaction: iValue,
                                            };
                                            (_c = smInformation.events.get(iValue.idShort)) === null || _c === void 0 ? void 0 : _c.push(evInter);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    getSubmodelInformation(aas, submodelRegex) {
        const aidModel = JSON.parse(aas);
        const smInformation = {
            actions: new Map(),
            events: new Map(),
            properties: new Map(),
            endpointMetadataArray: [],
            thing: new Map(),
        };
        if (aidModel instanceof Object && aidModel.submodels != null) {
            if (aidModel.submodels instanceof Array) {
                for (const submodel of aidModel.submodels) {
                    this.processSubmodel(smInformation, submodel, submodelRegex);
                }
            }
        }
        return smInformation;
    }
    _transform(smInformation, template) {
        const thing = template != null ? JSON.parse(template) : {};
        for (const [key, value] of smInformation.thing) {
            if (typeof value === "string") {
                thing[key] = value;
            }
            else {
            }
        }
        if (thing["@context"] == null) {
            thing["@context"] = "https://www.w3.org/2022/wot/td/v1.1";
        }
        if (!thing.title) {
            thing.title = "?TODO?";
        }
        if (thing.securityDefinitions == null) {
            thing.securityDefinitions = {};
        }
        const secNamesForEndpointMetadata = new Map();
        for (const endpointMetadata of smInformation.endpointMetadataArray) {
            const secNames = [];
            this.updateRootMetadata(thing, endpointMetadata);
            for (const [key, value] of Object.entries(thing.securityDefinitions)) {
                secNames.push(key);
            }
            secNamesForEndpointMetadata.set(endpointMetadata, secNames);
        }
        logDebug("########### PROPERTIES (" + smInformation.properties.size + ")");
        if (smInformation.properties.size > 0) {
            thing.properties = {};
            for (const [key, value] of smInformation.properties.entries()) {
                logInfo("Property" + key + " = " + value);
                thing.properties[key] = {};
                thing.properties[key].forms = [];
                for (const vi of value) {
                    for (const keyInteraction in vi.interaction) {
                        if (keyInteraction === "description") {
                            const aasDescription = vi.interaction[keyInteraction];
                            const tdDescription = {};
                            if (aasDescription instanceof Array) {
                                for (const aasDescriptionEntry of aasDescription) {
                                    if (aasDescriptionEntry.language != null && aasDescriptionEntry.text != null) {
                                        const language = aasDescriptionEntry.language;
                                        const text = aasDescriptionEntry.text;
                                        tdDescription[language] = text;
                                    }
                                }
                            }
                            thing.properties[key].descriptions = tdDescription;
                        }
                        else if (keyInteraction === "value") {
                            if (vi.interaction.value instanceof Array) {
                                for (const interactionValue of vi.interaction.value)
                                    if (interactionValue.idShort === "type") {
                                        if (interactionValue.value === "float") {
                                            thing.properties[key].type = "number";
                                        }
                                        else {
                                            thing.properties[key].type = interactionValue.value;
                                        }
                                    }
                                    else if (interactionValue.idShort === "range") {
                                        if (interactionValue.min != null) {
                                            thing.properties[key].min = interactionValue.min;
                                        }
                                        if (interactionValue.max != null) {
                                            thing.properties[key].max = interactionValue.max;
                                        }
                                    }
                                    else if (interactionValue.idShort === "observable") {
                                        thing.properties[key].observable = interactionValue.value === "true";
                                    }
                                    else if (interactionValue.idShort === "readOnly") {
                                        thing.properties[key].readOnly = interactionValue.value === "true";
                                    }
                                    else if (interactionValue.idShort === "writeOnly") {
                                        thing.properties[key].writeOnly = interactionValue.value === "true";
                                    }
                                    else if (interactionValue.idShort === "min_max") {
                                        if (thing.properties[key].type == null) {
                                            thing.properties[key].type = "number";
                                        }
                                        if (interactionValue.min != null) {
                                            thing.properties[key].minimum = Number(interactionValue.min);
                                        }
                                        if (interactionValue.max != null) {
                                            thing.properties[key].maximum = Number(interactionValue.max);
                                        }
                                    }
                                    else if (interactionValue.idShort === "itemsRange") {
                                        if (thing.properties[key].type == null) {
                                            thing.properties[key].type = "array";
                                        }
                                        if (interactionValue.min != null) {
                                            thing.properties[key].minItems = Number(interactionValue.min);
                                        }
                                        if (interactionValue.max != null) {
                                            thing.properties[key].maxItems = Number(interactionValue.max);
                                        }
                                    }
                                    else if (interactionValue.idShort === "lengthRange") {
                                        if (thing.properties[key].type == null) {
                                            thing.properties[key].type = "string";
                                        }
                                        if (interactionValue.min != null) {
                                            thing.properties[key].minLength = Number(interactionValue.min);
                                        }
                                        if (interactionValue.max != null) {
                                            thing.properties[key].maxLength = Number(interactionValue.max);
                                        }
                                    }
                                    else if (interactionValue.idShort === "forms") {
                                    }
                                    else {
                                        const key2 = interactionValue.idShort;
                                        thing.properties[key][key2] = interactionValue.value;
                                    }
                            }
                        }
                    }
                    if (vi.endpointMetadata) {
                        vi.secNamesForEndpoint = secNamesForEndpointMetadata.get(vi.endpointMetadata);
                    }
                    const form = this.createInteractionForm(vi, smInformation.endpointMetadataArray.length > 1);
                    thing.properties[key].forms.push(form);
                }
            }
        }
        logDebug("########### ACTIONS (" + smInformation.actions.size + ")");
        if (smInformation.actions.size > 0) {
            thing.actions = {};
            for (const [key, value] of smInformation.actions.entries()) {
                logInfo("Action" + key + " = " + value);
                thing.actions[key] = {};
                thing.actions[key].forms = [];
                for (const vi of value) {
                    if (vi.endpointMetadata) {
                        vi.secNamesForEndpoint = secNamesForEndpointMetadata.get(vi.endpointMetadata);
                    }
                    const form = this.createInteractionForm(vi, smInformation.endpointMetadataArray.length > 1);
                    thing.properties[key].forms.push(form);
                }
            }
        }
        logDebug("########### EVENTS (" + smInformation.events.size + ")");
        if (smInformation.events.size > 0) {
            thing.events = {};
            for (const [key, value] of smInformation.events.entries()) {
                logInfo("Event " + key + " = " + value);
                thing.events[key] = {};
                thing.events[key].forms = [];
                for (const vi of value) {
                    if (vi.endpointMetadata) {
                        vi.secNamesForEndpoint = secNamesForEndpointMetadata.get(vi.endpointMetadata);
                    }
                    const form = this.createInteractionForm(vi, smInformation.endpointMetadataArray.length > 1);
                    thing.properties[key].forms.push(form);
                }
            }
        }
        return JSON.stringify(thing);
    }
    createEndpointMetadata(td, protocol, submodelIdShort, submodelElementIdShort) {
        var _a;
        const values = [];
        let base = (_a = td.base) !== null && _a !== void 0 ? _a : "NO_BASE";
        if (td.base == null && td.properties) {
            for (const propertyKey in td.properties) {
                const property = td.properties[propertyKey];
                const formElementPicked = this.getFormForProtocol(property, protocol);
                if ((formElementPicked === null || formElementPicked === void 0 ? void 0 : formElementPicked.href) !== undefined) {
                    const urlParts = URLToolkit.parseURL(formElementPicked.href);
                    if (urlParts != null) {
                        urlParts.path = urlParts.params = urlParts.query = urlParts.fragment = "";
                        base = URLToolkit.buildURLFromParts(urlParts);
                        continue;
                    }
                }
            }
        }
        values.push({
            idShort: "base",
            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/td#baseURI"),
            valueType: "xs:anyURI",
            value: base,
            modelType: "Property",
        });
        const securityValues = [];
        if (td.security != null) {
            for (const secKey of td.security) {
                securityValues.push({
                    value: {
                        type: "ModelReference",
                        keys: [
                            {
                                type: "Submodel",
                                value: submodelIdShort,
                            },
                            {
                                type: "SubmodelElementCollection",
                                value: submodelElementIdShort,
                            },
                            {
                                type: "SubmodelElementCollection",
                                value: "EndpointMetadata",
                            },
                            {
                                type: "SubmodelElementCollection",
                                value: "securityDefinitions",
                            },
                            {
                                type: "SubmodelElementCollection",
                                value: secKey,
                            },
                        ],
                    },
                    modelType: "ReferenceElement",
                });
            }
        }
        values.push({
            idShort: "security",
            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/td#hasSecurityConfiguration"),
            typeValueListElement: "ReferenceElement",
            value: securityValues,
            modelType: "SubmodelElementList",
        });
        const securityDefinitionsValues = [];
        for (const secKey in td.securityDefinitions) {
            const secValue = td.securityDefinitions[secKey];
            const values = [];
            values.push({
                idShort: "scheme",
                semanticId: this.createSemanticId("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                valueType: "xs:string",
                value: secValue.scheme,
                modelType: "Property",
            });
            if (secValue.proxy != null) {
                values.push({
                    idShort: "proxy",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#proxy"),
                    valueType: "xs:string",
                    value: secValue.proxy,
                    modelType: "Property",
                });
            }
            if (secValue.name != null) {
                values.push({
                    idShort: "name",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#name"),
                    valueType: "xs:string",
                    value: secValue.name,
                    modelType: "Property",
                });
            }
            if (secValue.in != null) {
                values.push({
                    idShort: "in",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#in"),
                    valueType: "xs:string",
                    value: secValue.in,
                    modelType: "Property",
                });
            }
            if (secValue.qop != null) {
                values.push({
                    idShort: "qop",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#qop"),
                    valueType: "xs:string",
                    value: secValue.qop,
                    modelType: "Property",
                });
            }
            if (secValue.authorization != null) {
                values.push({
                    idShort: "authorization",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#authorization"),
                    valueType: "xs:string",
                    value: secValue.authorization,
                    modelType: "Property",
                });
            }
            if (secValue.alg != null) {
                values.push({
                    idShort: "alg",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#alg"),
                    valueType: "xs:string",
                    value: secValue.alg,
                    modelType: "Property",
                });
            }
            if (secValue.format != null) {
                values.push({
                    idShort: "format",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#format"),
                    valueType: "xs:string",
                    value: secValue.format,
                    modelType: "Property",
                });
            }
            if (secValue.identity != null) {
                values.push({
                    idShort: "identity",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#identity"),
                    valueType: "xs:string",
                    value: secValue.identity,
                    modelType: "Property",
                });
            }
            if (secValue.token != null) {
                values.push({
                    idShort: "token",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#token"),
                    valueType: "xs:string",
                    value: secValue.token,
                    modelType: "Property",
                });
            }
            if (secValue.refresh != null) {
                values.push({
                    idShort: "refresh",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#refresh"),
                    valueType: "xs:string",
                    value: secValue.refresh,
                    modelType: "Property",
                });
            }
            if (secValue.scopes != null) {
                values.push({
                    idShort: "scopes",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#scopes"),
                    valueType: "xs:string",
                    value: secValue.scopes,
                    modelType: "Property",
                });
            }
            if (secValue.flow != null) {
                values.push({
                    idShort: "flow",
                    semanticId: this.createSemanticId("https://www.w3.org/2019/wot/security#flow"),
                    valueType: "xs:string",
                    value: secValue.flow,
                    modelType: "Property",
                });
            }
            securityDefinitionsValues.push({
                idShort: secKey,
                value: values,
                modelType: "SubmodelElementCollection",
            });
        }
        values.push({
            idShort: "securityDefinitions",
            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/td#definesSecurityScheme"),
            value: securityDefinitionsValues,
            modelType: "SubmodelElementCollection",
        });
        const endpointMetadata = {
            idShort: "EndpointMetadata",
            semanticId: this.createSemanticId("https://admin-shell.io/idta/AssetInterfacesDescription/1/0/EndpointMetadata"),
            value: values,
            modelType: "SubmodelElementCollection",
        };
        return endpointMetadata;
    }
    getFormForProtocol(property, protocol) {
        let formElementPicked;
        if (property.forms) {
            for (const formElementProperty of property.forms) {
                if (formElementProperty.href != null && formElementProperty.href.startsWith(protocol)) {
                    formElementPicked = formElementProperty;
                    break;
                }
            }
        }
        return formElementPicked;
    }
    hasOp(form, op) {
        if (form.op != null) {
            if (typeof form.op === "string" && form.op === op) {
                return true;
            }
            else if (Array.isArray(form.op) && form.op.includes(op)) {
                return true;
            }
        }
        return false;
    }
    addRequiredAidTermsForForm(form, protocol) {
        if (form == null || protocol == null) {
            return;
        }
        if (protocol.startsWith("http")) {
            const htvKey = "htv:methodName";
            if (form[htvKey] == null) {
                if (this.hasOp(form, "readproperty") ||
                    this.hasOp(form, "readallproperties") ||
                    this.hasOp(form, "readmultipleproperties")) {
                    form[htvKey] = "GET";
                }
                else if (this.hasOp(form, "writeproperty") ||
                    this.hasOp(form, "writeallproperties") ||
                    this.hasOp(form, "writemultipleproperties")) {
                    form[htvKey] = "PUT";
                }
                else if (this.hasOp(form, "invokeaction")) {
                    form[htvKey] = "POST";
                }
            }
        }
        else if (protocol.startsWith("modbus")) {
            const mbKey = "modbus:function";
            if (form[mbKey] == null) {
                if (this.hasOp(form, "writeproperty") || this.hasOp(form, "invokeaction")) {
                    form[mbKey] = "writeSingleCoil";
                }
                else if (this.hasOp(form, "readallproperties") || this.hasOp(form, "readmultipleproperties")) {
                    form[mbKey] = "readHoldingRegisters";
                }
                else if (this.hasOp(form, "writeallproperties") || this.hasOp(form, "writemultipleproperties")) {
                    form[mbKey] = "writeMultipleHoldingRegisters";
                }
            }
        }
        else if (protocol.startsWith("mqtt")) {
            const mqvKey = "mqv:controlPacket";
            if (form[mqvKey] == null) {
                if (this.hasOp(form, "readproperty") ||
                    this.hasOp(form, "observeproperty") ||
                    this.hasOp(form, "readallproperties") ||
                    this.hasOp(form, "readmultipleproperties") ||
                    this.hasOp(form, "subscribeevent")) {
                    form[mqvKey] = "subscribe";
                }
                else if (this.hasOp(form, "writeproperty") ||
                    this.hasOp(form, "writeallproperties") ||
                    this.hasOp(form, "writemultipleproperties") ||
                    this.hasOp(form, "invokeaction")) {
                    form[mqvKey] = "publish";
                }
                else if (this.hasOp(form, "unobserveproperty") || this.hasOp(form, "unsubscribeevent")) {
                    form[mqvKey] = "unsubscribe";
                }
            }
        }
    }
    createInterfaceMetadata(td, protocol) {
        const properties = [];
        const actions = [];
        const events = [];
        if (protocol) {
            if (td.properties) {
                for (const propertyKey in td.properties) {
                    const property = td.properties[propertyKey];
                    const formElementPicked = this.getFormForProtocol(property, protocol);
                    if (formElementPicked === undefined) {
                        continue;
                    }
                    const propertyValues = [];
                    if (property.type != null) {
                        propertyValues.push({
                            idShort: "type",
                            semanticId: this.createSemanticId("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                            valueType: "xs:string",
                            value: property.type,
                            modelType: "Property",
                        });
                        if (property.minimum != null || property.maximum != null) {
                            const minMax = {
                                idShort: "min_max",
                                semanticId: this.createSemanticId("https://admin-shell.io/idta/AssetInterfacesDescription/1/0/minMaxRange"),
                                supplementalSemanticIds: [],
                                valueType: "integer".localeCompare(property.type) === 0 ? "xs:integer" : "xs:double",
                                modelType: "Range",
                            };
                            if (property.minimum != null) {
                                minMax.min = property.minimum.toString();
                                minMax.supplementalSemanticIds.push(this.createSemanticId("https://www.w3.org/2019/wot/json-schema#minimum"));
                            }
                            if (property.maximum != null) {
                                minMax.max = property.maximum.toString();
                                minMax.supplementalSemanticIds.push(this.createSemanticId("https://www.w3.org/2019/wot/json-schema#maximum"));
                            }
                            propertyValues.push(minMax);
                        }
                        if (property.minItems != null || property.maxItems != null) {
                            const itemsRange = {
                                idShort: "itemsRange",
                                semanticId: this.createSemanticId("https://admin-shell.io/idta/AssetInterfacesDescription/1/0/itemsRange"),
                                supplementalSemanticIds: [],
                                valueType: "xs:integer",
                                modelType: "Range",
                            };
                            if (property.minItems != null) {
                                itemsRange.min = property.minItems.toString();
                                itemsRange.supplementalSemanticIds.push(this.createSemanticId("https://www.w3.org/2019/wot/json-schema#minItems"));
                            }
                            if (property.maxItems != null) {
                                itemsRange.max = property.maxItems.toString();
                                itemsRange.supplementalSemanticIds.push(this.createSemanticId("https://www.w3.org/2019/wot/json-schema#maxItems"));
                            }
                            propertyValues.push(itemsRange);
                        }
                        if (property.minLength != null || property.maxLength != null) {
                            const lengthRange = {
                                idShort: "lengthRange",
                                semanticId: this.createSemanticId("https://admin-shell.io/idta/AssetInterfacesDescription/1/0/lengthRange"),
                                supplementalSemanticIds: [],
                                valueType: "xs:integer",
                                modelType: "Range",
                            };
                            if (property.minLength != null) {
                                lengthRange.min = property.minLength.toString();
                                lengthRange.supplementalSemanticIds.push(this.createSemanticId("https://www.w3.org/2019/wot/json-schema#minLength"));
                            }
                            if (property.maxLength != null) {
                                lengthRange.max = property.maxLength.toString();
                                lengthRange.supplementalSemanticIds.push(this.createSemanticId("https://www.w3.org/2019/wot/json-schema#maxLength"));
                            }
                            propertyValues.push(lengthRange);
                        }
                    }
                    if (property.title != null) {
                        propertyValues.push({
                            idShort: "title",
                            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/td#title"),
                            valueType: "xs:string",
                            value: property.title,
                            modelType: "Property",
                        });
                    }
                    if (property.description != null) {
                    }
                    if (property.observable != null && property.observable === true) {
                        propertyValues.push({
                            idShort: "observable",
                            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/td#isObservable"),
                            valueType: "xs:boolean",
                            value: `${property.observable}`,
                            modelType: "Property",
                        });
                    }
                    if (property.contentMediaType != null) {
                        propertyValues.push({
                            idShort: "contentMediaType",
                            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/json-schema#contentMediaType"),
                            valueType: "xs:string",
                            value: property.contentMediaType,
                            modelType: "Property",
                        });
                    }
                    if (property.const != null) {
                        propertyValues.push({
                            idShort: "const",
                            valueType: "xs:string",
                            value: property.const,
                            modelType: "Property",
                        });
                    }
                    if (property.default != null) {
                        propertyValues.push({
                            idShort: "default",
                            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/json-schema#default"),
                            valueType: this.getSimpleValueTypeXsd(property.default),
                            value: property.default,
                            modelType: "Property",
                        });
                    }
                    if (property.unit != null) {
                        propertyValues.push({
                            idShort: "unit",
                            valueType: "xs:string",
                            value: property.unit,
                            modelType: "Property",
                        });
                    }
                    if (formElementPicked != null) {
                        const propertyForm = [];
                        this.addRequiredAidTermsForForm(formElementPicked, protocol);
                        for (let formTerm in formElementPicked) {
                            let formValue = formElementPicked[formTerm];
                            if (formTerm === "href" &&
                                td.base != null &&
                                td.base.length > 0 &&
                                typeof formValue === "string" &&
                                formValue.startsWith(td.base)) {
                                formValue = formValue.substring(td.base.length);
                            }
                            let semanticId;
                            if (formTerm === "href") {
                                semanticId = "https://www.w3.org/2019/wot/hypermedia#hasTarget";
                            }
                            else if (formTerm === "contentType") {
                                semanticId = "https://www.w3.org/2019/wot/hypermedia#forContentType";
                            }
                            else if (formTerm === "htv:methodName") {
                                semanticId = "https://www.w3.org/2011/http#methodName";
                            }
                            else if (formTerm === "htv:headers") {
                                semanticId = "https://www.w3.org/2011/http#headers";
                            }
                            else if (formTerm === "htv:fieldName") {
                                semanticId = "https://www.w3.org/2011/http#fieldName";
                            }
                            else if (formTerm === "htv:fieldValue") {
                                semanticId = "https://www.w3.org/2011/http#fieldValue";
                            }
                            else if (formTerm === "modbus:function") {
                                semanticId = "https://www.w3.org/2019/wot/modbus#Function";
                            }
                            else if (formTerm === "modbus:entity") {
                                semanticId = "https://www.w3.org/2019/wot/modbus#Entity";
                            }
                            else if (formTerm === "modbus:zeroBasedAddressing") {
                                semanticId = "https://www.w3.org/2019/wot/modbus#hasZeroBasedAddressingFlag";
                            }
                            else if (formTerm === "modbus:timeout") {
                                semanticId = "https://www.w3.org/2019/wot/modbus#hasTimeout";
                            }
                            else if (formTerm === "modbus:pollingTime") {
                                semanticId = "https://www.w3.org/2019/wot/modbus#hasPollingTime";
                            }
                            else if (formTerm === "modbus:type") {
                                semanticId = "https://www.w3.org/2019/wot/modbus#type";
                            }
                            else if (formTerm === "mqv:retain") {
                                semanticId = "https://www.w3.org/2019/wot/mqtt#hasRetainFlag";
                            }
                            else if (formTerm === "mqv:controlPacket") {
                                semanticId = "https://www.w3.org/2019/wot/mqtt#ControlPacket";
                            }
                            else if (formTerm === "mqv:qos") {
                                semanticId = "https://www.w3.org/2019/wot/mqtt#hasQoSFlag";
                            }
                            formTerm = formTerm.replace(":", "_");
                            if (typeof formValue === "string" ||
                                typeof formValue === "number" ||
                                typeof formValue === "boolean") {
                                if (semanticId !== undefined) {
                                    propertyForm.push({
                                        idShort: formTerm,
                                        semanticId: this.createSemanticId(semanticId),
                                        valueType: this.getSimpleValueTypeXsd(formValue),
                                        value: formValue.toString(),
                                        modelType: "Property",
                                    });
                                }
                                else {
                                }
                            }
                        }
                        propertyValues.push({
                            idShort: "forms",
                            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/td#hasForm"),
                            value: propertyForm,
                            modelType: "SubmodelElementCollection",
                        });
                    }
                    let description;
                    if (property.descriptions) {
                        description = [];
                        for (const langKey in property.descriptions) {
                            const langValue = property.descriptions[langKey];
                            description.push({
                                language: langKey,
                                text: langValue,
                            });
                        }
                    }
                    else if (property.description != null) {
                        description = [];
                        description.push({
                            language: "en",
                            text: property.description,
                        });
                    }
                    properties.push({
                        idShort: propertyKey,
                        description,
                        semanticId: this.createSemanticId("https://admin-shell.io/idta/AssetInterfaceDescription/1/0/PropertyDefinition"),
                        supplementalSemanticIds: [this.createSemanticId("https://www.w3.org/2019/wot/td#name")],
                        value: propertyValues,
                        modelType: "SubmodelElementCollection",
                    });
                }
            }
            if (td.actions) {
            }
            if (td.events) {
            }
        }
        const values = [];
        values.push({
            idShort: "properties",
            semanticId: this.createSemanticId("https://www.w3.org/2019/wot/td#PropertyAffordance"),
            value: properties,
            modelType: "SubmodelElementCollection",
        });
        values.push({
            idShort: "actions",
            value: actions,
            modelType: "SubmodelElementCollection",
        });
        values.push({
            idShort: "events",
            value: events,
            modelType: "SubmodelElementCollection",
        });
        const interfaceMetadata = {
            idShort: "InterfaceMetadata",
            semanticId: this.createSemanticId("https://admin-shell.io/idta/AssetInterfacesDescription/1/0/InterfaceMetadata"),
            supplementalSemanticIds: [this.createSemanticId("https://www.w3.org/2019/wot/td#InteractionAffordance")],
            value: values,
            modelType: "SubmodelElementCollection",
        };
        return interfaceMetadata;
    }
}
exports.AssetInterfaceDescriptionUtil = AssetInterfaceDescriptionUtil;
//# sourceMappingURL=asset-interface-description.js.map