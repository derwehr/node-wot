import * as WoT from "wot-typescript-definitions";
import ExposedThing from "./exposed-thing";
import { ProtocolClientFactory, ProtocolServer, ProtocolClient } from "./protocol-interfaces";
import { ContentCodec } from "./content-serdes";
export default class Servient {
    #private;
    private servers;
    private clientFactories;
    private things;
    private credentialStore;
    addMediaType(codec: ContentCodec, offered?: boolean): void;
    expose(thing: ExposedThing): Promise<void>;
    addThing(thing: ExposedThing): boolean;
    destroyThing(thingId: string): Promise<boolean>;
    getThing(id: string): ExposedThing | undefined;
    getThings(): Record<string, WoT.ThingDescription>;
    addServer(server: ProtocolServer): boolean;
    getServers(): Array<ProtocolServer>;
    addClientFactory(clientFactory: ProtocolClientFactory): void;
    removeClientFactory(scheme: string): boolean;
    hasClientFor(scheme: string): boolean;
    getClientFor(scheme: string): ProtocolClient;
    getClientSchemes(): string[];
    addCredentials(credentials: Record<string, unknown>): void;
    getCredentials(identifier: string): unknown;
    retrieveCredentials(identifier: string): Array<unknown> | undefined;
    start(): Promise<typeof WoT>;
    shutdown(): Promise<void>;
}
