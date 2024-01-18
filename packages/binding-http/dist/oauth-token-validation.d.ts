/// <reference types="node" />
import * as http from "http";
export interface Method {
    name: string;
}
export interface IntrospectionEndpoint extends Method {
    endpoint: string;
    allowSelfSigned?: boolean;
    credentials?: {
        username: string;
        password: string;
    };
}
export declare abstract class Validator {
    abstract validate(tokenRequest: http.IncomingMessage, scopes: Array<string>, clients: RegExp): Promise<boolean>;
}
export declare class EndpointValidator extends Validator {
    private config;
    private agent;
    constructor(config: IntrospectionEndpoint);
    validate(tokenRequest: http.IncomingMessage, scopes: Array<string>, clients: RegExp): Promise<boolean>;
}
export default function (method?: Method): EndpointValidator;
