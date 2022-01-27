/********************************************************************************
 * Copyright (c) 2022 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * Document License (2015-05-13) which is available at
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/


import Ajv, { ValidateFunction, ErrorObject } from "ajv";
import { LinkElement } from "wot-thing-description-types";
import TMSchema from "./tm-json-schema-validation.json";
import { DataSchema, ExposedThingInit } from "wot-typescript-definitions";
import Servient, { Helpers } from "./core";
import { SomeJSONSchema } from "ajv/dist/types/json-schema";
// import { DataSchemaValue, ExposedThingInit } from "wot-typescript-definitions";

const tmSchema = TMSchema;
// RegExps take from https://github.com/ajv-validator/ajv-formats/blob/master/src/formats.ts
const ajv = new Ajv({ strict: false })
    .addFormat(
        "iri-reference",
        /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i
    )
    .addFormat(
        "uri-reference",
        /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i
    ) // TODO: check me
    .addFormat("uri", /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/)
    .addFormat("json-pointer", /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/) // TODO: check me
    .addFormat(
        "date-time",
        /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/
    );

export type LINK_TYPE = 'tm:extends' | 'tm:submodel';
export type AFFORDANCE_TYPE = 'properties' | 'actions' | 'events';
export type COMPOSITION_TYPE = 'extends' | 'imports';
export type ModelImportsInput = {
    uri?: string,
    type: AFFORDANCE_TYPE,
    name: string
}

export type CompositionOptions = {
    baseUrl?: string,
    selfComposition?: boolean,
    map?: Record<string, unknown>
}

export type modelComposeInput = {
    extends?: ExposedThingInit[],
    imports?: (ModelImportsInput & { affordance: DataSchema })[]
    submodel?: Record<string, ExposedThingInit>
}

export default class ThingModelHelpers {
    static tsSchemaValidator = ajv.compile(ThingModelHelpers.createExposeThingInitSchema(tmSchema)) as ValidateFunction;

    private srv: Servient;
    private helpers: Helpers;
    private deps: string[] = [] as string[];

    constructor(srv: Servient) {
        this.srv = srv;
        this.helpers = new Helpers(this.srv);
    }

    private static getThingModelRef(data: Record<string, unknown>): Record<string, unknown> {
        const refs = {} as Record<string, unknown>;
        if (!data) {
            return refs;
        }
        for (const key in data) {
            for (const key1 in (data[key] as Record<string, unknown>)) {
                if (key1 === 'tm:ref') {
                    refs[key] = (data[key] as Record<string, unknown>)['tm:ref'] as string;
                }
            }
        }
        return refs;
    }

    private static getThingModelLinks(data: Record<string, unknown>, type: LINK_TYPE): LinkElement[] {
        let links = [] as LinkElement[];
        if ('links' in data && Array.isArray(data.links)) {
            links = data.links;
        }
        return links.filter(el => el.rel === type);
    }



    private static extendThingModel(source: ExposedThingInit, dest: ExposedThingInit): ExposedThingInit {
        let extendedModel = {} as ExposedThingInit;
        const properties = source.properties;
        const actions = source.actions;
        const events = source.events;
        extendedModel = { ...source, ...dest };
        // TODO: implement validation for extending
        if (properties) {
            for (const key in properties) {
                if (dest.properties && key in dest.properties) {
                    extendedModel.properties[key] = { ...properties[key], ...dest.properties[key] };
                } else {
                    extendedModel.properties[key] = properties[key];
                }
            }
            // extendedModel.properties = { ...properties, ...dest.properties };
        }
        if (actions) {
            for (const key in actions) {
                if (dest.actions && key in dest.actions) {
                    extendedModel.actions[key] = { ...actions[key], ...dest.actions[key] };
                } else {
                    extendedModel.actions[key] = actions[key];
                }
            }
            // extendedModel.actions = { ...actions, ...dest.actions };
        }
        if (events) {
            for (const key in events) {
                if (dest.events && key in dest.events) {
                    extendedModel.events[key] = { ...events[key], ...dest.events[key] };
                } else {
                    extendedModel.events[key] = events[key];
                }
            }
            // extendedModel.events = { ...events, ...dest.events };
        }
        return extendedModel;
    }


    private static importAffordance(affordanceType: AFFORDANCE_TYPE, affordanceName: string, source: DataSchema, dest: ExposedThingInit): ExposedThingInit {
        const d = dest[affordanceType][affordanceName];
        dest[affordanceType][affordanceName] = { ...source, ...d };
        for (const key in dest[affordanceType][affordanceName]) {
            if (dest[affordanceType][affordanceName][key] === null) {
                delete dest[affordanceType][affordanceName][key];
            }
        }
        return dest;
    }

    private static formatSubmodelLink(source: ExposedThingInit, oldHref: string, newHref: string) {
        const index = source.links.findIndex(el => el.href === oldHref);
        const el = source.links[index];
        if ('instanceName' in el) {
            delete el.instanceName;
        }
        source.links[index] = {
            ...el,
            href: newHref,
            "type": 'application/td+json',
            rel: 'item'
        };
        return source;
    }

    private parseTmRef(value: string): ModelImportsInput {
        const thingModelUri = value.split('#')[0];
        const affordaceUri = value.split('#')[1];
        const affordaceType = affordaceUri.split('/')[1] as AFFORDANCE_TYPE;
        const affordaceName = affordaceUri.split('/')[2];
        return { uri: thingModelUri, type: affordaceType, name: affordaceName };
    }

    private getRefAffordance(obj: ModelImportsInput, thing: ExposedThingInit): DataSchema {
        const affordanceType = obj.type;
        const affordanceKey = obj.name;
        if (!(affordanceType in thing)) {
            return null;
        }
        const affordances = thing[affordanceType] as DataSchema;
        if (!(affordanceKey in affordances)) {
            return null;
        }
        return affordances[affordanceKey];
    }


    public async fetchAffordances(data: ExposedThingInit): Promise<modelComposeInput> {
        const modelInput: modelComposeInput = {};
        const extLinks = ThingModelHelpers.getThingModelLinks(data, 'tm:extends');
        if (extLinks.length > 0) {
            modelInput.extends = [] as ExposedThingInit[];
            for (const s of extLinks) {
                let source = await this.fetchModel(s.href);
                [source] = await this.getPartialTDs(source);
                modelInput.extends.push(source as ExposedThingInit);
            }
        }
        const affordanceTypes = ['properties', 'actions', 'events'];
        modelInput.imports = [];
        for (const affType of affordanceTypes) {
            const affRefs = ThingModelHelpers.getThingModelRef(data[affType] as DataSchema);
            if (Object.keys(affRefs).length > 0) {
                for (const aff in affRefs) {
                    const affUri = affRefs[aff] as string;
                    const refObj = this.parseTmRef(affUri);
                    let source = await this.fetchModel(refObj.uri);
                    [source] = await this.getPartialTDs(source);
                    delete ((data[affType] as DataSchema)[aff])['tm:ref'];
                    const importedAffordance = this.getRefAffordance(refObj, source);
                    refObj.name = aff; // update the name of the affordance
                    modelInput.imports.push({ affordance: importedAffordance, ...refObj })
                }
            }
        }
        const tmLinks = ThingModelHelpers.getThingModelLinks(data, 'tm:submodel');
        if (tmLinks.length > 0) {
            modelInput.submodel = {} as Record<string, ExposedThingInit>;
            for (const l of tmLinks) {
                const submodel = await this.fetchModel(l.href);
                modelInput.submodel[l.href] = submodel;
            }
        }
        return modelInput;
    }

    private fillPlaceholder(data: Record<string, unknown>, map: Record<string, unknown>): ExposedThingInit {
        let dataString = JSON.stringify(data);
        for (const key in map) {
            const value = map[key];
            let word = `{{${key}}}`;
            const instances = (dataString.match(new RegExp(word, "g")) || []).length;
            for (let i = 0; i < instances; i++) {
                word = `{{${key}}}`;
                const re = `"(${word})"`;
                const match = dataString.match(re);
                if (match === null) { // word is included in another string/number/element. Keep that type
                    dataString = dataString.replace(word, value as string);
                } else { // keep the new value type
                    if (typeof value !== "string") {
                        word = `"{{${key}}}"`;
                    }
                    dataString = dataString.replace(word, value as string);
                }
            }
        }
        return JSON.parse(dataString);
    }


    public async composeModel(data: ExposedThingInit, modelObject: modelComposeInput, options?: CompositionOptions): Promise<ExposedThingInit[]> {
        let partialTDs = [] as ExposedThingInit[];
        const title = data.title.replace(/ /g, '');
        if (!options) {
            options = {} as CompositionOptions;
        }
        if (!options.baseUrl) {
            options.baseUrl = '.';
        }
        const newTMHref = this.returnNewTMHref(options.baseUrl, title);
        const newTDHref = this.returnNewTDHref(options.baseUrl, title);
        if ('extends' in modelObject) {
            const extendObjs = modelObject.extends;
            for (const key in extendObjs) {
                const el = extendObjs[key];
                data = ThingModelHelpers.extendThingModel(el, data);
            }
            // remove the tm:extends links
            data.links = data.links.filter(link => link.rel !== 'tm:extends');
        }
        if ('imports' in modelObject) {
            const importObjs = modelObject.imports;
            for (const key in importObjs) {
                const el = importObjs[key];
                data = ThingModelHelpers.importAffordance(el.type, el.name, el.affordance, data);
            }
        }
        if ('submodel' in modelObject) {
            const submodelObj = modelObject.submodel;

            for (const key in submodelObj) {
                const sub = submodelObj[key]
                if (options.selfComposition) {
                    const index = data.links.findIndex(el => el.href === key);
                    const el = data.links[index];
                    const instanceName = el.instanceName;
                    if (!instanceName) {
                        throw new Error('Self composition is not possible without instance names');
                    }
                    // self composition enabled, just one TD expected
                    const [subPartialTD] = await this.getPartialTDs(sub, options);
                    const affordanceTypes = ['properties', 'actions', 'events'];
                    for (const affType of affordanceTypes) {
                        for (const affKey in subPartialTD[affType] as DataSchema) {
                            const newAffKey = `${instanceName}_${affKey}`;
                            if (!(affType in data)) {
                                data[affType] = {} as DataSchema;
                            }
                            (data[affType] as DataSchema)[newAffKey] = (subPartialTD[affType] as DataSchema)[affKey] as DataSchema;
                        }
                    }

                } else {
                    const subTitle = sub.title.replace(/ /g, '');
                    const subNewHref = this.returnNewTDHref(options.baseUrl, subTitle);
                    if (!('links' in sub)) {
                        sub.links = [];
                    }
                    sub.links.push({
                        "rel": "collection",
                        "href": newTDHref,
                        "type": "application/td+json"
                    })
                    const tmpPartialSubTDs = await this.getPartialTDs(sub, options);
                    partialTDs.push(...tmpPartialSubTDs);
                    data = ThingModelHelpers.formatSubmodelLink(data, key, subNewHref);
                }
            }
        }
        if (!('links' in data) || options.selfComposition) {
            data.links = [];
        }
        // add reference to the thing model
        data.links.push({
            "rel": "type",
            "href": newTMHref,
            "type": "application/tm+json"
        });
        // change the @type
        if (data['@type'] instanceof Array) {
            data['@type'] = data['@type'].map(el => {
                if (el === 'tm:ThingModel') {
                    return 'Thing';
                }
                return el;
            });
        } else {
            data['@type'] = 'Thing';
        }
        if ('version' in data) {
            delete data.version;
        }
        if (options.map) {
            data = this.fillPlaceholder(data, options.map);
        }
        partialTDs.unshift(data); // put itself as first element
        partialTDs = partialTDs.map(el => this.fillPlaceholder(el, options.map)); // TODO: make more efficient, since repeated each recursive call
        if (this.deps.length > 0) {
            this.removeDependency();
        }
        return partialTDs;
    }

    public async getPartialTDs(model: ExposedThingInit, options?: CompositionOptions): Promise<ExposedThingInit[]> {
        let isValid = ThingModelHelpers.validateExposedThingModelInit(model);
        if (isValid.valid === false || isValid.errors !== undefined) {
            throw new Error(isValid.errors);
        }
        isValid = this.checkPlaceholderMap(model, options?.map);
        if (isValid.valid === false || isValid.errors !== undefined) {
            throw new Error(isValid.errors);
        }

        const modelInput = await this.fetchAffordances(model);
        const extendedModels = await this.composeModel(model, modelInput, options);
        return extendedModels;
    }


    /**
     * Helper function to remove reserved keywords in required property of TM JSON Schema
     */
    static createExposeThingInitSchema(tmSchema: unknown): SomeJSONSchema { // TODO: check me
        const tmSchemaCopy = JSON.parse(JSON.stringify(tmSchema));

        if (tmSchemaCopy.required !== undefined) {
            const reservedKeywords: Array<string> = [
                "title",
                "@context",
                "instance",
                "forms",
                "security",
                "href",
                "securityDefinitions",
            ];
            if (Array.isArray(tmSchemaCopy.required)) {
                const reqProps: Array<string> = tmSchemaCopy.required;
                tmSchemaCopy.required = reqProps.filter((n) => !reservedKeywords.includes(n));
            } else if (typeof tmSchemaCopy.required === "string") {
                if (reservedKeywords.indexOf(tmSchemaCopy.required) !== -1) delete tmSchemaCopy.required;
            }
        }

        if (tmSchemaCopy.definitions !== undefined) {
            for (const prop in tmSchemaCopy.definitions) {
                tmSchemaCopy.definitions[prop] = this.createExposeThingInitSchema(tmSchemaCopy.definitions[prop]);
            }
        }

        return tmSchemaCopy;
    }

    public static validateExposedThingModelInit(data: ExposedThingInit): { valid: boolean; errors: string } {
        if (Array.isArray(data["@type"])) {
            const valid = data["@type"].filter(x => x === 'tm:ThingModel').length > 0;
            if (!valid) {
                return {
                    valid: false,
                    errors: "ThingModel missing in @type array",
                };
            }
        } else if (data["@type"] !== "tm:ThingModel") {
            return {
                valid: false,
                errors: "ThingModel missing in @type definition",
            };
        }
        const isValid = ThingModelHelpers.tsSchemaValidator(data);
        let errors;
        if (!isValid) {
            errors = ThingModelHelpers.tsSchemaValidator.errors.map((o: ErrorObject) => o.message).join("\n");
        }
        return {
            valid: isValid,
            errors: errors,
        };
    }

    private checkPlaceholderMap(model: ExposedThingInit, map: Record<string, unknown>): { valid: boolean; errors: string } {
        const regex = '{{.*?}}';
        const modelString = JSON.stringify(model);
        // first check if model needs map
        let keys = (modelString.match(new RegExp(regex, "g")) || []);
        keys = keys.map(el => el.replace('{{', '').replace('}}', ''));
        let isValid = true;
        let errors;
        if (keys && keys.length > 0 && (map === undefined || map === null)) {
            isValid = false;
            errors = `No map provided for model ${model.title}`;
        } else if (keys.length > 0) {
            keys.every(key => {
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
            errors: errors,
        };

    }  


    public async fetchModel(uri: string): Promise<ExposedThingInit> {
        this.addDependency(uri);
        return await this.helpers.fetch(uri) as ExposedThingInit;
    }


    public static isThingModelThingDescription(data: Record<string, unknown>): boolean {
        if (this.getThingModelRef(data).length > 0) { // FIXME: different from specifications
            return true;
        }
        if ('links' in data && Array.isArray(data.links)) {
            let foundTmExtendsRel = false;
            data.links.forEach((link) => {
                if (link.rel !== undefined && link.rel === "tm:extends") foundTmExtendsRel = true;
            });
            if (foundTmExtendsRel) return true;
        }

        if (data.properties !== undefined) {
            for (const prop in <Record<string, unknown>>data.properties) {
                const properties = <Record<string, Record<string, unknown>>>data.properties;
                if (this.isThingModelThingDescription(properties[prop])) return true;
            }
        }

        return false;
    }

    private returnNewTMHref(baseUrl: string, tdname: string) {
        return `${baseUrl}/${tdname}.tm.jsonld`;
    }

    private returnNewTDHref(baseUrl: string, tdname: string) {
        return `${baseUrl}/${tdname}.td.jsonld`;
    }

    public static getModelVersion(data: ExposedThingInit): string {
        if (!('version' in data) || !('model' in data.version)) {
            return null;
        }
        return data.version.model as string;
    }

    private addDependency(dep: string) {
        if (this.deps.indexOf(dep) > -1) {
            throw new Error(`Circular dependency found for ${dep}`);
        }
        this.deps.push(dep);
    }

    private removeDependency(dep?: string) {
        if (dep) {
            this.deps = this.deps.filter(el => el !== dep);
        } else {
            this.deps.pop();
        }
    }


}
