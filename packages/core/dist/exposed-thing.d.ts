import * as WoT from "wot-typescript-definitions";
import * as TDT from "wot-thing-description-types";
import * as TD from "@node-wot/td-tools";
import Servient from "./servient";
import { Content, PropertyContentMap } from "./core";
import { ContentListener } from "./protocol-interfaces";
export default class ExposedThing extends TD.Thing implements WoT.ExposedThing {
    #private;
    security: string | [string, ...string[]];
    securityDefinitions: {
        [key: string]: TDT.SecurityScheme;
    };
    id: string;
    title: string;
    base?: string;
    forms?: Array<TD.Form>;
    properties: {
        [key: string]: TDT.PropertyElement;
    };
    actions: {
        [key: string]: TDT.ActionElement;
    };
    events: {
        [key: string]: TDT.EventElement;
    };
    constructor(servient: Servient, thingModel?: WoT.ExposedThingInit);
    getThingDescription(): WoT.ThingDescription;
    emitEvent(name: string, data: WoT.InteractionInput): void;
    emitPropertyChange(name: string): Promise<void>;
    expose(): Promise<void>;
    destroy(): Promise<void>;
    setPropertyReadHandler(propertyName: string, handler: WoT.PropertyReadHandler): WoT.ExposedThing;
    setPropertyWriteHandler(propertyName: string, handler: WoT.PropertyWriteHandler): WoT.ExposedThing;
    setPropertyObserveHandler(name: string, handler: WoT.PropertyReadHandler): WoT.ExposedThing;
    setPropertyUnobserveHandler(name: string, handler: WoT.PropertyReadHandler): WoT.ExposedThing;
    setActionHandler(actionName: string, handler: WoT.ActionHandler): WoT.ExposedThing;
    setEventSubscribeHandler(name: string, handler: WoT.EventSubscriptionHandler): WoT.ExposedThing;
    setEventUnsubscribeHandler(name: string, handler: WoT.EventSubscriptionHandler): WoT.ExposedThing;
    handleInvokeAction(name: string, inputContent: Content, options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<Content | void>;
    handleReadProperty(propertyName: string, options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<Content>;
    _handleReadProperties(propertyNames: string[], options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<PropertyContentMap>;
    handleReadAllProperties(options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<PropertyContentMap>;
    handleReadMultipleProperties(propertyNames: string[], options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<PropertyContentMap>;
    handleWriteProperty(propertyName: string, inputContent: Content, options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<void>;
    handleWriteMultipleProperties(valueMap: PropertyContentMap, options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<void>;
    handleSubscribeEvent(name: string, listener: ContentListener, options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<void>;
    handleUnsubscribeEvent(name: string, listener: ContentListener, options: WoT.InteractionOptions & {
        formIndex: number;
    }): void;
    handleObserveProperty(name: string, listener: ContentListener, options: WoT.InteractionOptions & {
        formIndex: number;
    }): Promise<void>;
    handleUnobserveProperty(name: string, listener: ContentListener, options: WoT.InteractionOptions & {
        formIndex: number;
    }): void;
    private static interactionInputToReadable;
}