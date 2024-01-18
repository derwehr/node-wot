import * as TD from "@node-wot/td-tools";
import { Subscription } from "rxjs/Subscription";
import Servient from "./servient";
import ExposedThing from "./exposed-thing";
import { Content } from "./content";
export declare type PropertyContentMap = Map<string, Content>;
export declare type ContentListener = (data: Content) => void;
export declare type PropertyHandlers = {
    readHandler?: WoT.PropertyReadHandler;
    writeHandler?: WoT.PropertyWriteHandler;
    observeHandler?: WoT.PropertyReadHandler;
    unobserveHandler?: WoT.PropertyReadHandler;
};
export declare type PropertyHandlerMap = Map<string, PropertyHandlers>;
export declare type ActionHandlerMap = Map<string, WoT.ActionHandler>;
export declare type EventHandlers = {
    subscribe?: WoT.EventSubscriptionHandler;
    unsubscribe?: WoT.EventSubscriptionHandler;
};
export declare type EventHandlerMap = Map<string, EventHandlers>;
export declare type ListenerItem = {
    [formIndex: number]: ContentListener[];
};
export declare type ListenerMap = Map<string, ListenerItem>;
export interface ProtocolClient {
    readResource(form: TD.Form): Promise<Content>;
    writeResource(form: TD.Form, content: Content): Promise<void>;
    invokeResource(form: TD.Form, content?: Content): Promise<Content>;
    unlinkResource(form: TD.Form): Promise<void>;
    subscribeResource(form: TD.Form, next: (content: Content) => void, error?: (error: Error) => void, complete?: () => void): Promise<Subscription>;
    requestThingDescription(uri: string): Promise<Content>;
    start(): Promise<void>;
    stop(): Promise<void>;
    setSecurity(metadata: Array<TD.SecurityScheme>, credentials?: unknown): boolean;
}
export interface ProtocolClientFactory {
    readonly scheme: string;
    getClient(): ProtocolClient;
    init(): boolean;
    destroy(): boolean;
}
export interface ProtocolServer {
    readonly scheme: string;
    expose(thing: ExposedThing, tdTemplate?: WoT.ThingDescription): Promise<void>;
    destroy(thingId: string): Promise<boolean>;
    start(servient: Servient): Promise<void>;
    stop(): Promise<void>;
    getPort(): number;
}
export declare enum Endianness {
    BIG_ENDIAN = "BIG_ENDIAN",
    LITTLE_ENDIAN = "LITTLE_ENDIAN",
    BIG_ENDIAN_BYTE_SWAP = "BIG_ENDIAN_BYTE_SWAP",
    LITTLE_ENDIAN_BYTE_SWAP = "LITTLE_ENDIAN_BYTE_SWAP"
}
