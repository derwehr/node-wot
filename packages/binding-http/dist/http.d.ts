import * as TD from "@node-wot/td-tools";
import { Method } from "./oauth-token-validation";
import { MiddlewareRequestHandler } from "./http-server-middleware";
export { default as HttpServer } from "./http-server";
export { default as HttpClient } from "./http-client";
export { default as HttpClientFactory } from "./http-client-factory";
export { default as HttpsClientFactory } from "./https-client-factory";
export { MiddlewareRequestHandler } from "./http-server-middleware";
export * from "./http-server";
export * from "./http-client";
export * from "./http-client-factory";
export * from "./https-client-factory";
export interface HttpProxyConfig {
    href: string;
    scheme?: "basic" | "bearer";
    token?: string;
    username?: string;
    password?: string;
}
export interface HttpConfig {
    port?: number;
    address?: string;
    baseUri?: string;
    urlRewrite?: Record<string, string>;
    proxy?: HttpProxyConfig;
    allowSelfSigned?: boolean;
    serverKey?: string;
    serverCert?: string;
    security?: TD.SecurityScheme[];
    middleware?: MiddlewareRequestHandler;
}
export interface OAuth2ServerConfig extends TD.SecurityScheme {
    method: Method;
    allowedClients?: string;
}
export interface TuyaCustomBearerSecurityScheme extends TD.SecurityScheme {
    scheme: "TuyaCustomBearer";
    baseUri: string;
}
export declare type HTTPMethodName = "GET" | "PUT" | "POST" | "DELETE" | "PATCH" | "HEAD";
export declare class HttpHeader {
    "htv:fieldName": string;
    "htv:fieldValue": string;
}
export declare class HttpForm extends TD.Form {
    "htv:methodName"?: HTTPMethodName;
    "htv:headers"?: Array<HttpHeader> | HttpHeader;
}