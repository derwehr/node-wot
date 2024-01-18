import * as WoT from "wot-typescript-definitions";
import { Content } from "./content";
export declare class InteractionOutput implements WoT.InteractionOutput {
    #private;
    dataUsed: boolean;
    form?: WoT.Form;
    schema?: WoT.DataSchema;
    get data(): ReadableStream;
    constructor(content: Content, form?: WoT.Form, schema?: WoT.DataSchema);
    arrayBuffer(): Promise<ArrayBuffer>;
    value<T extends WoT.DataSchemaValue>(): Promise<T>;
}
