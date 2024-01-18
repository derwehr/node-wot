import { ProtocolServer, Servient, ExposedThing } from "@node-wot/core";
import { HttpServer, HttpConfig } from "@node-wot/binding-http";
export default class WebSocketServer implements ProtocolServer {
    readonly scheme: string;
    readonly PROPERTY_DIR: string;
    readonly ACTION_DIR: string;
    readonly EVENT_DIR: string;
    private readonly port;
    private readonly address?;
    private readonly ownServer;
    private readonly httpServer;
    private readonly thingNames;
    private readonly thingPaths;
    private readonly socketServers;
    constructor(serverOrConfig?: HttpServer | HttpConfig);
    start(servient: Servient): Promise<void>;
    stop(): Promise<void>;
    getPort(): number;
    expose(thing: ExposedThing): Promise<void>;
    destroy(thingId: string): Promise<boolean>;
}
