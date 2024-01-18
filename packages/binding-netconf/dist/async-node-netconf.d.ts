import * as nodeNetconf from "node-netconf";
import { NetConfCredentials, RpcMethod } from "./netconf";
export declare class Client {
    private router;
    private connected;
    private routerParams?;
    constructor();
    getRouter(): nodeNetconf.Client | null;
    deleteRouter(): void;
    initializeRouter(host: string, port: number, credentials: NetConfCredentials): Promise<void>;
    openRouter(): Promise<void>;
    rpc(xpathQuery: string, method: RpcMethod, NSs: Record<string, string>, target: string, payload?: unknown): Promise<unknown>;
    closeRouter(): void;
}
