import { ExposedThing } from "@node-wot/core";
interface MdnsDiscoveryParameters {
    urlPath: string;
    port: number;
    serviceName: string;
    scheme?: string;
    type?: "Thing" | "Directory";
}
declare type IpAddressFamily = "IPv4" | "IPv6";
export declare class MdnsIntroducer {
    private readonly mdns;
    private readonly mdnsEntries;
    private readonly ipAddressFamily;
    constructor(address?: string, ipAddressFamily?: IpAddressFamily);
    private sendMdnsResponses;
    private determineTarget;
    private createTxtData;
    registerExposedThing(thing: ExposedThing, parameters: MdnsDiscoveryParameters): void;
    delete(urlPath: string): void;
    close(): Promise<void>;
}
export {};
