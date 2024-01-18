import * as WoT from "wot-typescript-definitions";
import { Servient } from "@node-wot/core";
import { CompilerFunction } from "vm2";
export interface ScriptOptions {
    argv?: Array<string>;
    compiler?: CompilerFunction;
    env?: Record<string, string>;
}
export default class DefaultServient extends Servient {
    private static readonly defaultConfig;
    private uncaughtListeners;
    private runtime;
    readonly config: any;
    logLevel: string;
    constructor(clientOnly: boolean, config?: any);
    runScript(code: string, filename?: string): unknown;
    runPrivilegedScript(code: string, filename?: string, options?: ScriptOptions): unknown;
    private logScriptError;
    start(): Promise<typeof WoT>;
    shutdown(): Promise<void>;
    private readonly loggers;
    private setLogLevel;
}
