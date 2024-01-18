import { Form } from "@node-wot/td-tools";
export { default as CoapServer } from "./coap-server";
export { default as CoapClientFactory } from "./coap-client-factory";
export { default as CoapClient } from "./coap-client";
export { default as CoapsClientFactory } from "./coaps-client-factory";
export { default as CoapsClient } from "./coaps-client";
export * from "./coap-server";
export * from "./coap-client-factory";
export * from "./coap-client";
export * from "./coaps-client-factory";
export * from "./coaps-client";
export interface CoapServerConfig {
    port?: number;
    address?: string;
}
export declare type CoapMethodName = "GET" | "POST" | "PUT" | "DELETE" | "FETCH" | "PATCH" | "iPATCH";
export declare type BlockSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024;
export declare type BlockSizeOptionValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface BlockWiseTransferParameters {
    "cov:block2Size"?: BlockSize;
    "cov:block1Size"?: BlockSize;
}
export declare class CoapForm extends Form {
    "cov:method"?: CoapMethodName;
    "cov:hopLimit"?: number;
    "cov:blockwise"?: BlockWiseTransferParameters;
    "cov:qblockwise"?: BlockWiseTransferParameters;
    "cov:contentFormat"?: number;
    "cov:accept"?: number;
}
export declare function isValidCoapMethod(methodName: CoapMethodName): methodName is CoapMethodName;
export declare function isSupportedCoapMethod(methodName: CoapMethodName): methodName is CoapMethodName;
export declare function blockSizeToOptionValue(blockSize: BlockSize): BlockSizeOptionValue;
