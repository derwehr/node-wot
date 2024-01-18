#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_default_servient_1 = __importDefault(require("./cli-default-servient"));
const fs = require("fs");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const commander_1 = require("commander");
const ajv_1 = __importDefault(require("ajv"));
const wot_servient_schema_conf_json_1 = __importDefault(require("./wot-servient-schema.conf.json"));
const lodash_1 = __importDefault(require("lodash"));
const package_json_1 = require("@node-wot/core/package.json");
const core_1 = require("@node-wot/core");
const inspector_1 = __importDefault(require("inspector"));
const { error, info, warn } = (0, core_1.createLoggers)("cli", "cli");
const program = new commander_1.Command();
const ajv = new ajv_1.default({ strict: true });
const schemaValidator = ajv.compile(wot_servient_schema_conf_json_1.default);
const defaultFile = "wot-servient.conf.json";
const baseDir = ".";
const dotEnvConfigParamters = {};
program
    .name("wot-servient")
    .description(`
Run a WoT Servient in the current directory.
    `)
    .helpOption("-h, --help", "show this help")
    .version(package_json_1.version, "-v, --version", "display node-wot version");
program.addHelpText("after", `
wot-servient.conf.json syntax:
{
    "servient": {
        "clientOnly": CLIENTONLY,
        "staticAddress": STATIC,
        "scriptAction": RUNSCRIPT
    },
    "http": {
        "port": HPORT,
        "address": HADDRESS,
        "baseUri": HBASEURI,
        "urlRewrite": HURLREWRITE,
        "proxy": PROXY,
        "allowSelfSigned": ALLOW
    },
    "mqtt" : {
        "broker": BROKER-URL,
        "username": BROKER-USERNAME,
        "password": BROKER-PASSWORD,
        "clientId": BROKER-UNIQUEID,
        "protocolVersion": MQTT_VERSION
    },
    "credentials": {
        THING_ID1: {
            "token": TOKEN
        },
        THING_ID2: {
            "username": USERNAME,
            "password": PASSWORD
        }
    }
}

wot-servient.conf.json fields:
  CLIENTONLY      : boolean setting if no servers shall be started (default=false)
  STATIC          : string with hostname or IP literal for static address config
  RUNSCRIPT       : boolean to activate the 'runScript' Action (default=false)
  HPORT           : integer defining the HTTP listening port
  HADDRESS        : string defining HTTP address
  HBASEURI        : string defining HTTP base URI
  HURLREWRITE     : map (from URL -> to URL) defining HTTP URL rewrites
  PROXY           : object with "href" field for the proxy URI,
                                "scheme" field for either "basic" or "bearer", and
                                corresponding credential fields as defined below
  ALLOW           : boolean whether self-signed certificates should be allowed
  BROKER-URL      : URL to an MQTT broker that publisher and subscribers will use
  BROKER-UNIQUEID : unique id set by MQTT client while connecting to the broker
  MQTT_VERSION    : number indicating the MQTT protocol version to be used (3, 4, or 5)
  THING_IDx       : string with TD "id" for which credentials should be configured
  TOKEN           : string for providing a Bearer token
  USERNAME        : string for providing a Basic Auth username
  PASSWORD        : string for providing a Basic Auth password
  ---------------------------------------------------------------------------

Environment variables must be provided in a .env file in the current working directory.

Example:
VAR1=Value1
VAR2=Value2`);
function parseIp(value, previous) {
    if (!/^([a-z]*|[\d.]*)(:[0-9]{2,5})?$/.test(value)) {
        throw new commander_1.InvalidArgumentError("Invalid host:port combo");
    }
    return value;
}
function parseConfigFile(filename, previous) {
    var _a;
    try {
        const open = filename || path.join(baseDir, defaultFile);
        const data = fs.readFileSync(open, "utf-8");
        if (!schemaValidator(JSON.parse(data))) {
            throw new commander_1.InvalidArgumentError(`Config file contains invalid an JSON: ${((_a = schemaValidator.errors) !== null && _a !== void 0 ? _a : [])
                .map((o) => o.message)
                .join("\n")}`);
        }
        return filename;
    }
    catch (err) {
        throw new commander_1.InvalidArgumentError(`Error reading config file: ${err}`);
    }
}
function parseConfigParams(param, previous) {
    var _a;
    if (!/^([a-zA-Z0-9_.]+):=([a-zA-Z0-9_]+)$/.test(param)) {
        throw new commander_1.InvalidArgumentError("Invalid key-value pair");
    }
    const fieldNamePath = param.split(":=")[0];
    const fieldNameValue = param.split(":=")[1];
    let fieldNameValueCast;
    if (Number(fieldNameValue)) {
        fieldNameValueCast = +fieldNameValue;
    }
    else if (fieldNameValue === "true" || fieldNameValue === "false") {
        fieldNameValueCast = Boolean(fieldNameValue);
    }
    else {
        fieldNameValueCast = fieldNamePath;
    }
    const obj = lodash_1.default.set({}, fieldNamePath, fieldNameValueCast);
    if (!schemaValidator(obj)) {
        throw new commander_1.InvalidArgumentError(`Config parameter '${param}' is not valid: ${((_a = schemaValidator.errors) !== null && _a !== void 0 ? _a : [])
            .map((o) => o.message)
            .join("\n")}`);
    }
    let result = previous !== null && previous !== void 0 ? previous : {};
    result = lodash_1.default.merge(result, obj);
    return result;
}
program
    .option("-i, --inspect [host]:[port]", "activate inspector on host:port (default: 127.0.0.1:9229)", parseIp)
    .option("-ib, --inspect-brk [host]:[port]", "activate inspector on host:port (default: 127.0.0.1:9229)", parseIp)
    .option("-c, --client-only", "do not start any servers (enables multiple instances without port conflicts)")
    .option("-cp, --compiler <module>", "load module as a compiler")
    .option("-f, --config-file <file>", "load configuration from specified file", parseConfigFile, "wot-servient.conf.json")
    .option("-p, --config-params <param...>", "override configuration parameters [key1:=value1 key2:=value2 ...] (e.g. http.port:=8080)", parseConfigParams);
program.addArgument(new commander_1.Argument("[files...]", "script files to execute. If no script is given, all .js files in the current directory are loaded. If one or more script is given, these files are loaded instead of the directory."));
program.parse(process.argv);
const options = program.opts();
const args = program.args;
const env = dotenv.config();
const errorNoException = env.error;
if ((errorNoException === null || errorNoException === void 0 ? void 0 : errorNoException.code) !== "ENOENT") {
    throw env.error;
}
else if (env.parsed) {
    for (const [key, value] of Object.entries(env.parsed)) {
        if (key.startsWith("config.")) {
            dotEnvConfigParamters[key.replace("config.", "")] = value;
        }
    }
}
function buildConfig() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const fileToOpen = (_a = options === null || options === void 0 ? void 0 : options.configFile) !== null && _a !== void 0 ? _a : path.join(baseDir, defaultFile);
        let configFileData = {};
        try {
            configFileData = JSON.parse(yield fs.promises.readFile(fileToOpen, "utf-8"));
        }
        catch (err) {
            error(`WoT-Servient config file error: ${err}`);
        }
        for (const [key, value] of Object.entries(dotEnvConfigParamters)) {
            const obj = lodash_1.default.set({}, key, value);
            configFileData = lodash_1.default.merge(configFileData, obj);
        }
        if ((options === null || options === void 0 ? void 0 : options.configParams) != null) {
            configFileData = lodash_1.default.merge(configFileData, options.configParams);
        }
        return configFileData;
    });
}
const loadCompilerFunction = function (compilerModule) {
    if (compilerModule != null) {
        const compilerMod = require(compilerModule);
        if (compilerMod.create == null) {
            throw new Error("No create function defined for " + compilerModule);
        }
        const compilerObject = compilerMod.create();
        if (compilerObject.compile == null) {
            throw new Error("No compile function defined for create return object");
        }
        return compilerObject.compile;
    }
    return undefined;
};
const loadEnvVariables = function () {
    const env = dotenv.config();
    const errorNoException = env.error;
    if ((errorNoException === null || errorNoException === void 0 ? void 0 : errorNoException.code) !== "ENOENT") {
        throw env.error;
    }
    return env;
};
const runScripts = function (servient, scripts, debug) {
    return __awaiter(this, void 0, void 0, function* () {
        const env = loadEnvVariables();
        const launchScripts = (scripts) => {
            const compile = loadCompilerFunction(options.compiler);
            scripts.forEach((fname) => {
                info(`WoT-Servient reading script ${fname}`);
                fs.readFile(fname, "utf8", (err, data) => {
                    if (err) {
                        error(`WoT-Servient experienced error while reading script. ${err}`);
                    }
                    else {
                        info(`WoT-Servient running script '${data.substr(0, data.indexOf("\n")).replace("\r", "")}'... (${data.split(/\r\n|\r|\n/).length} lines)`);
                        fname = path.resolve(fname);
                        servient.runPrivilegedScript(data, fname, {
                            argv: args,
                            env: env.parsed,
                            compiler: compile,
                        });
                    }
                });
            });
        };
        if (debug && debug.shouldBreak) {
            inspector_1.default.url() == null && inspector_1.default.open(debug.port, debug.host, true);
            const session = new inspector_1.default.Session();
            session.connect();
            session.post("Debugger.enable", (error) => {
                if (error != null) {
                    warn("Cannot set breakpoint; reason: cannot enable debugger");
                    warn(error.toString());
                }
                session.post("Debugger.setBreakpointByUrl", {
                    lineNumber: 0,
                    url: "file:///" + path.resolve(scripts[0]).replace(/\\/g, "/"),
                }, (err) => {
                    if (err != null) {
                        warn("Cannot set breakpoint");
                        warn(error.toString());
                    }
                    launchScripts(scripts);
                });
            });
        }
        else {
            debug != null && inspector_1.default.url() == null && inspector_1.default.open(debug.port, debug.host, false);
            launchScripts(scripts);
        }
    });
};
const runAllScripts = function (servient, debug) {
    fs.readdir(baseDir, (err, files) => {
        if (err) {
            warn(`WoT-Servient experienced error while loading directory. ${err}`);
            return;
        }
        const scripts = files.filter((file) => {
            return file.substr(0, 1) !== "." && file.slice(-3) === ".js";
        });
        info(`WoT-Servient using current directory with ${scripts.length} script${scripts.length > 1 ? "s" : ""}`);
        runScripts(servient, scripts.map((filename) => path.resolve(path.join(baseDir, filename))), debug);
    });
};
buildConfig()
    .then((conf) => {
    return new cli_default_servient_1.default(options.clientOnly, conf);
})
    .catch((err) => {
    if (err.code === "ENOENT" && options.configFile == null) {
        warn(`WoT-Servient using defaults as '${defaultFile}' does not exist`);
        return new cli_default_servient_1.default(options.clientOnly);
    }
    else {
        error(`"WoT-Servient config file error. ${err}`);
        process.exit(err.errno);
    }
})
    .then((servient) => {
    servient
        .start()
        .then(() => {
        var _a, _b;
        if (args.length > 0) {
            info(`WoT-Servient loading ${args.length} command line script${args.length > 1 ? "s" : ""}`);
            return runScripts(servient, args, (_a = options.inspect) !== null && _a !== void 0 ? _a : options.inspectBrk);
        }
        else {
            return runAllScripts(servient, (_b = options.inspect) !== null && _b !== void 0 ? _b : options.inspectBrk);
        }
    })
        .catch((err) => {
        error(`WoT-Servient cannot start. ${err}`);
    });
})
    .catch((err) => error(`WoT-Servient main error. ${err}`));
//# sourceMappingURL=cli.js.map