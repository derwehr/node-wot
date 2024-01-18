/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import HttpServer from "../http-server";
export default function actionRoute(this: HttpServer, req: IncomingMessage, res: ServerResponse, _params: {
    [k: string]: string | undefined;
}): Promise<void>;
