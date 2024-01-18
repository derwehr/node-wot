import { Form } from "@node-wot/td-tools";
export { default as NetconfClient } from "./netconf-client";
export { default as NetconfClientFactory } from "./netconf-client-factory";
export * from "./netconf";
export * from "./netconf-client-factory";
export declare class NetconfForm extends Form {
    "nc:NSs"?: Record<string, string>;
    "nc:method"?: string;
    "nc:target"?: string;
}
export declare type RpcMethod = "GET-CONFIG" | "EDIT-CONFIG" | "COMMIT" | "RPC";
export interface NetConfCredentials {
    username: string;
    password?: string;
    privateKey?: string;
}
export declare function isRpcMethod(method?: string): method is RpcMethod;
