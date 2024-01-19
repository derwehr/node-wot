import { ValidateFunction } from "ajv";
import { DataSchema, ExposedThingInit } from "wot-typescript-definitions";
import { ThingModel } from "wot-thing-model-types";
import { Resolver } from "./resolver-interface";
export declare type LINK_TYPE = "tm:extends" | "tm:submodel";
export declare type AFFORDANCE_TYPE = "properties" | "actions" | "events";
export declare type COMPOSITION_TYPE = "extends" | "imports";
export declare type ModelImportsInput = {
    uri?: string;
    type: AFFORDANCE_TYPE;
    name: string;
};
export declare type CompositionOptions = {
    baseUrl?: string;
    selfComposition?: boolean;
    map?: Record<string, unknown>;
};
export declare type modelComposeInput = {
    extends?: ThingModel[];
    imports?: (ModelImportsInput & {
        affordance: DataSchema;
    })[];
    submodel?: Record<string, ThingModel>;
};
export declare class ThingModelHelpers {
    static tsSchemaValidator: ValidateFunction<unknown>;
    private deps;
    private resolver?;
    constructor(_resolver?: Resolver);
    static isThingModel(_data: unknown): _data is ThingModel;
    static getModelVersion(data: ThingModel): string | undefined;
    static validateThingModel(data: ThingModel): {
        valid: boolean;
        errors?: string;
    };
    getPartialTDs(model: unknown, options?: CompositionOptions): Promise<ExposedThingInit[]>;
    fetchModel(uri: string): Promise<ThingModel>;
    private localFetch;
    private _getPartialTDs;
    private fetchAffordances;
    private composeModel;
    private static getThingModelRef;
    private static getThingModelLinks;
    private static extendThingModel;
    private static importAffordance;
    private static formatSubmodelLink;
    private parseTmRef;
    private getRefAffordance;
    private fillPlaceholder;
    private checkPlaceholderMap;
    private returnNewTMHref;
    private returnNewTDHref;
    private addDependency;
    private removeDependency;
}