import * as WoT from "wot-typescript-definitions";
import * as TDT from "wot-thing-description-types";
export declare const DEFAULT_CONTEXT_V1 = "https://www.w3.org/2019/wot/td/v1";
export declare const DEFAULT_CONTEXT_V11 = "https://www.w3.org/2022/wot/td/v1.1";
export declare const DEFAULT_CONTEXT_LANGUAGE = "en";
export declare const DEFAULT_THING_TYPE = "Thing";
export default class Thing implements TDT.ThingDescription {
    title: TDT.Title;
    securityDefinitions: {
        [key: string]: TDT.SecurityScheme;
    };
    security: string | [string, ...string[]];
    "@context": TDT.ThingContext;
    [key: string]: any;
    constructor();
}
export declare type ThingInteraction = TDT.PropertyElement | TDT.ActionElement | TDT.EventElement;
export declare class Form implements TDT.FormElementBase {
    op?: string | string[];
    href: TDT.AnyUri;
    contentType?: string;
    contentCoding?: string;
    subprotocol?: TDT.Subprotocol;
    security?: TDT.Security;
    scopes?: TDT.Scopes;
    response?: TDT.ExpectedResponse;
    additionalResponses?: TDT.AdditionalResponsesDefinition;
    [k: string]: unknown;
    constructor(href: string, contentType?: string);
}
export interface ExpectedResponse {
    contentType?: string;
}
export declare type DataSchema = WoT.DataSchema & (BooleanSchema | IntegerSchema | NumberSchema | StringSchema | ObjectSchema | ArraySchema | NullSchema);
export declare class BaseSchema {
    type?: string;
    title?: TDT.Title;
    titles?: TDT.Titles;
    description?: TDT.Description;
    descriptions?: TDT.Descriptions;
    writeOnly?: boolean;
    readOnly?: boolean;
    oneOf?: Array<DataSchema>;
    unit?: string;
    const?: unknown;
    enum?: Array<unknown>;
}
export interface BooleanSchema extends BaseSchema {
    type: "boolean";
}
export interface IntegerSchema extends BaseSchema {
    type: "integer";
    minimum?: number;
    maximum?: number;
}
export interface NumberSchema extends BaseSchema {
    type: "number";
    minimum?: number;
    maximum?: number;
}
export interface StringSchema extends BaseSchema {
    type: "string";
}
export interface ObjectSchema extends BaseSchema {
    type: "object";
    properties: {
        [key: string]: DataSchema;
    };
    required?: Array<string>;
}
export interface ArraySchema extends BaseSchema {
    type: "array";
    items: DataSchema;
    minItems?: number;
    maxItems?: number;
}
export interface NullSchema extends BaseSchema {
    type: "null";
}
export declare type SecurityType = NoSecurityScheme | BasicSecurityScheme | DigestSecurityScheme | BearerSecurityScheme | APIKeySecurityScheme | OAuth2SecurityScheme | PSKSecurityScheme;
export interface SecurityScheme {
    scheme: string;
    description?: TDT.Description;
    descriptions?: TDT.Descriptions;
    proxy?: TDT.AnyUri;
    [k: string]: unknown;
}
export interface NoSecurityScheme extends SecurityScheme, TDT.NoSecurityScheme {
    scheme: "nosec";
}
export interface BasicSecurityScheme extends SecurityScheme, TDT.BasicSecurityScheme {
    scheme: "basic";
}
export interface DigestSecurityScheme extends SecurityScheme, TDT.DigestSecurityScheme {
    scheme: "digest";
}
export interface APIKeySecurityScheme extends SecurityScheme, TDT.ApiKeySecurityScheme {
    scheme: "apikey";
}
export interface BearerSecurityScheme extends SecurityScheme, TDT.BearerSecurityScheme {
    scheme: "bearer";
}
export interface PSKSecurityScheme extends SecurityScheme, TDT.PskSecurityScheme {
    scheme: "psk";
}
export interface OAuth2SecurityScheme extends SecurityScheme, TDT.OAuth2SecurityScheme {
    scheme: "oauth2";
}
export declare abstract class ThingProperty extends BaseSchema {
    observable?: boolean;
    type?: string;
    forms?: Array<Form>;
    title?: TDT.Title;
    titles?: TDT.Titles;
    description?: TDT.Description;
    descriptions?: TDT.Descriptions;
    scopes?: Array<string>;
    uriVariables?: {
        [key: string]: DataSchema;
    };
    security?: Array<string>;
    [key: string]: any;
}
export declare abstract class ThingAction {
    input?: DataSchema;
    output?: DataSchema;
    safe?: boolean;
    idempotent?: boolean;
    forms?: Array<Form>;
    title?: TDT.Title;
    titles?: TDT.Titles;
    description?: TDT.Description;
    descriptions?: TDT.Descriptions;
    scopes?: Array<string>;
    uriVariables?: {
        [key: string]: DataSchema;
    };
    security?: Array<string>;
    [key: string]: any;
}
export declare abstract class ThingEvent {
    subscription?: DataSchema;
    data?: DataSchema;
    cancellation?: DataSchema;
    forms?: Array<Form>;
    title?: TDT.Title;
    titles?: TDT.Titles;
    description?: TDT.Description;
    descriptions?: TDT.Descriptions;
    scopes?: Array<string>;
    uriVariables?: {
        [key: string]: DataSchema;
    };
    security?: Array<string>;
    [key: string]: any;
}