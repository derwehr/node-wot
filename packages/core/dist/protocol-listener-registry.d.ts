import { DataSchema, InteractionInput } from "wot-typescript-definitions";
import { ContentListener } from "./protocol-interfaces";
import { ThingInteraction } from "@node-wot/td-tools";
export default class ProtocolListenerRegistry {
    private static EMPTY_MAP;
    private listeners;
    register(affordance: ThingInteraction, formIndex: number, listener: ContentListener): void;
    unregister(affordance: ThingInteraction, formIndex: number, listener: ContentListener): void;
    unregisterAll(): void;
    notify(affordance: ThingInteraction, data: InteractionInput, schema?: DataSchema, formIndex?: number): void;
}