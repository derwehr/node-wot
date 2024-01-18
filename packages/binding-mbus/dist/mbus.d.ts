import { Form } from "@node-wot/td-tools";
export { default as MBusClientFactory } from "./mbus-client-factory";
export { default as MBusClient } from "./mbus-client";
export * from "./mbus-client";
export * from "./mbus-client-factory";
export declare class MBusForm extends Form {
    "mbus:unitID": number;
    "mbus:offset"?: number;
    "mbus:timeout"?: number;
}
