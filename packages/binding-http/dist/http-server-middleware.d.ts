/// <reference types="node" />
import * as http from "http";
export declare type MiddlewareRequestHandler = (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => Promise<void>;
