import * as TD from "@node-wot/td-tools";
export { default as HttpClient } from "./http-client";
export { default as HttpClientFactory } from "./http-client-factory";
export { default as HttpsClientFactory } from "./https-client-factory";
export * from "./http-client";
export * from "./http-client-factory";
export * from "./https-client-factory";
export interface HttpProxyConfig {
    href: string;
    scheme?: string;
    token?: string;
    username?: string;
    password?: string;
}
export interface HttpConfig {
    port?: number;
    address?: string;
    proxy?: HttpProxyConfig;
    allowSelfSigned?: boolean;
    serverKey?: string;
    serverCert?: string;
    security?: TD.SecurityScheme;
}
export declare class HttpHeader {
    "http:fieldName": number;
    "http:fieldValue": unknown;
}
export declare class HttpForm extends TD.Form {
    "http:methodName"?: string;
    "http:headers"?: Array<HttpHeader> | HttpHeader;
}