import { ConsumedThing as IConsumedThing, InteractionInput, Subscription } from "wot-typescript-definitions";
import * as TD from "@node-wot/td-tools";
import Servient from "./servient";
import { ProtocolClient } from "./protocol-interfaces";
import { ActionElement, EventElement, PropertyElement } from "wot-thing-description-types";
import { ThingInteraction } from "@node-wot/td-tools";
declare enum Affordance {
    PropertyAffordance = 0,
    ActionAffordance = 1,
    EventAffordance = 2
}
export interface ClientAndForm {
    client: ProtocolClient;
    form?: TD.Form;
}
export default class ConsumedThing extends TD.Thing implements IConsumedThing {
    #private;
    properties: {
        [key: string]: PropertyElement;
    };
    actions: {
        [key: string]: ActionElement;
    };
    events: {
        [key: string]: EventElement;
    };
    private subscribedEvents;
    private observedProperties;
    constructor(servient: Servient, thingModel?: TD.ThingModel);
    getThingDescription(): WoT.ThingDescription;
    emitEvent(name: string, data: InteractionInput): void;
    extendInteractions(): void;
    findForm(forms: Array<TD.Form>, op: string, affordance: Affordance, schemes: string[], idx: number): TD.Form | undefined;
    getSecuritySchemes(security: Array<string>): Array<TD.SecurityScheme>;
    ensureClientSecurity(client: ProtocolClient, form: TD.Form | undefined): void;
    getClientFor(forms: Array<TD.Form>, op: string, affordance: Affordance, options?: WoT.InteractionOptions): ClientAndForm;
    readProperty(propertyName: string, options?: WoT.InteractionOptions): Promise<WoT.InteractionOutput>;
    _readProperties(propertyNames: string[]): Promise<WoT.PropertyReadMap>;
    readAllProperties(options?: WoT.InteractionOptions): Promise<WoT.PropertyReadMap>;
    readMultipleProperties(propertyNames: string[], options?: WoT.InteractionOptions): Promise<WoT.PropertyReadMap>;
    writeProperty(propertyName: string, value: WoT.InteractionInput, options?: WoT.InteractionOptions): Promise<void>;
    writeMultipleProperties(valueMap: WoT.PropertyWriteMap, options?: WoT.InteractionOptions): Promise<void>;
    invokeAction(actionName: string, parameter?: InteractionInput, options?: WoT.InteractionOptions): Promise<WoT.InteractionOutput>;
    observeProperty(name: string, listener: WoT.WotListener, errorListener?: WoT.ErrorListener, options?: WoT.InteractionOptions): Promise<Subscription>;
    subscribeEvent(name: string, listener: WoT.WotListener, errorListener?: WoT.ErrorListener, options?: WoT.InteractionOptions): Promise<Subscription>;
    handleUriVariables(ti: ThingInteraction, form: TD.Form, options?: WoT.InteractionOptions): TD.Form;
}
export {};
