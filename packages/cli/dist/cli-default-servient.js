"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const binding_http_1 = require("@node-wot/binding-http");
const binding_coap_1 = require("@node-wot/binding-coap");
const binding_mqtt_1 = require("@node-wot/binding-mqtt");
const binding_file_1 = require("@node-wot/binding-file");
const vm2_1 = require("vm2");
const td_tools_1 = require("@node-wot/td-tools");
const { debug, error, info } = (0, core_1.createLoggers)("cli", "cli-default-servient");
function isObject(item) {
    return item != null && typeof item === "object" && !Array.isArray(item);
}
function mergeConfigs(target, source) {
    const output = Object.assign({}, target);
    Object.keys(source).forEach((key) => {
        if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
        }
        else {
            if (isObject(target[key]) && isObject(source[key])) {
                output[key] = mergeConfigs(target[key], source[key]);
            }
            else {
                Object.assign(output, { [key]: source[key] });
            }
        }
    });
    return output;
}
class DefaultServient extends core_1.Servient {
    constructor(clientOnly, config) {
        var _a;
        var _b;
        super();
        this.uncaughtListeners = [];
        this.logLevel = "info";
        this.loggers = {
            warn: console.warn,
            info: console.info,
            debug: console.debug,
        };
        this.config =
            typeof config === "object"
                ? mergeConfigs(DefaultServient.defaultConfig, config)
                : DefaultServient.defaultConfig;
        if (clientOnly) {
            (_a = (_b = this.config).servient) !== null && _a !== void 0 ? _a : (_b.servient = {});
            this.config.servient.clientOnly = true;
        }
        this.setLogLevel(this.config.log.level);
        this.addCredentials(this.config.credentials);
        if (this.config.credentials != null) {
            delete this.config.credentials;
        }
        debug("DefaultServient configured with");
        debug(`${this.config}`);
        if (typeof this.config.servient.staticAddress === "string") {
            core_1.Helpers.setStaticAddress(this.config.servient.staticAddress);
        }
        let coapServer;
        if (this.config.servient.clientOnly === false) {
            if (this.config.http != null) {
                const httpServer = new binding_http_1.HttpServer(this.config.http);
                this.addServer(httpServer);
            }
            const coapConfig = this.config.coap;
            if (coapConfig != null) {
                coapServer = new binding_coap_1.CoapServer(coapConfig);
                this.addServer(coapServer);
            }
            if (this.config.mqtt != null) {
                const mqttBrokerServer = new binding_mqtt_1.MqttBrokerServer({
                    uri: this.config.mqtt.broker,
                    user: typeof this.config.mqtt.username === "string" ? this.config.mqtt.username : undefined,
                    psw: typeof this.config.mqtt.password === "string" ? this.config.mqtt.password : undefined,
                    clientId: typeof this.config.mqtt.clientId === "string" ? this.config.mqtt.clientId : undefined,
                    protocolVersion: typeof this.config.mqtt.protocolVersion === "number"
                        ? this.config.mqtt.protocolVersion
                        : undefined,
                });
                this.addServer(mqttBrokerServer);
            }
        }
        this.addClientFactory(new binding_file_1.FileClientFactory());
        this.addClientFactory(new binding_http_1.HttpClientFactory(this.config.http));
        this.addClientFactory(new binding_http_1.HttpsClientFactory(this.config.http));
        this.addClientFactory(new binding_coap_1.CoapClientFactory(coapServer));
        this.addClientFactory(new binding_coap_1.CoapsClientFactory());
        this.addClientFactory(new binding_mqtt_1.MqttClientFactory());
    }
    runScript(code, filename = "script") {
        if (!this.runtime) {
            throw new Error("WoT runtime not loaded; have you called start()?");
        }
        const helpers = new core_1.Helpers(this);
        const context = {
            WoT: this.runtime,
            WoTHelpers: helpers,
            ModelHelpers: new td_tools_1.ThingModelHelpers(helpers),
        };
        const vm = new vm2_1.NodeVM({
            sandbox: context,
        });
        const listener = (err) => {
            this.logScriptError(`Asynchronous script error '${filename}'`, err);
            process.exit(1);
        };
        process.prependListener("uncaughtException", listener);
        this.uncaughtListeners.push(listener);
        try {
            return vm.run(code, filename);
        }
        catch (err) {
            if (err instanceof Error) {
                this.logScriptError(`Servient found error in script '${filename}'`, err);
            }
            else {
                error(`Servient found error in script '${filename}' ${err}`);
            }
            return undefined;
        }
    }
    runPrivilegedScript(code, filename = "script", options = {}) {
        if (!this.runtime) {
            throw new Error("WoT runtime not loaded; have you called start()?");
        }
        const helpers = new core_1.Helpers(this);
        const context = {
            WoT: this.runtime,
            WoTHelpers: helpers,
            ModelHelpers: new td_tools_1.ThingModelHelpers(helpers),
        };
        const vm = new vm2_1.NodeVM({
            sandbox: context,
            require: {
                external: true,
                builtin: ["*"],
            },
            argv: options.argv,
            compiler: options.compiler,
            env: options.env,
        });
        const listener = (err) => {
            this.logScriptError(`Asynchronous script error '${filename}'`, err);
            process.exit(1);
        };
        process.prependListener("uncaughtException", listener);
        this.uncaughtListeners.push(listener);
        try {
            return vm.run(code, filename);
        }
        catch (err) {
            if (err instanceof Error) {
                this.logScriptError(`Servient found error in privileged script '${filename}'`, err);
            }
            else {
                error(`Servient found error in privileged script '${filename}' ${err}`);
            }
            return undefined;
        }
    }
    logScriptError(description, err) {
        let message;
        if (typeof err === "object" && err.stack != null) {
            const match = err.stack.match(/evalmachine\.<anonymous>:([0-9]+:[0-9]+)/);
            if (Array.isArray(match)) {
                message = `and halted at line ${match[1]}\n    ${err}`;
            }
            else {
                message = `and halted with ${err.stack}`;
            }
        }
        else {
            message = `that threw ${typeof err} instead of Error\n    ${err}`;
        }
        error(`Servient caught ${description} ${message}`);
    }
    start() {
        return new Promise((resolve, reject) => {
            super
                .start()
                .then((myWoT) => {
                info("DefaultServient started");
                this.runtime = myWoT;
                myWoT
                    .produce({
                    title: "servient",
                    description: "node-wot CLI Servient",
                    properties: {
                        things: {
                            type: "object",
                            description: "Get things",
                            observable: false,
                            readOnly: true,
                        },
                    },
                    actions: {
                        setLogLevel: {
                            description: "Set log level",
                            input: { oneOf: [{ type: "string" }, { type: "number" }] },
                            output: { type: "string" },
                        },
                        shutdown: {
                            description: "Stop servient",
                            output: { type: "string" },
                        },
                        runScript: {
                            description: "Run script",
                            input: { type: "string" },
                            output: { type: "string" },
                        },
                    },
                })
                    .then((thing) => {
                    thing.setActionHandler("setLogLevel", (level) => __awaiter(this, void 0, void 0, function* () {
                        const ll = yield core_1.Helpers.parseInteractionOutput(level);
                        if (typeof ll === "number") {
                            this.setLogLevel(ll);
                        }
                        else if (typeof ll === "string") {
                            this.setLogLevel(ll);
                        }
                        else {
                            this.setLogLevel(ll + "");
                        }
                        return `Log level set to '${this.logLevel}'`;
                    }));
                    thing.setActionHandler("shutdown", () => __awaiter(this, void 0, void 0, function* () {
                        debug("shutting down by remote");
                        yield this.shutdown();
                        return undefined;
                    }));
                    thing.setActionHandler("runScript", (script) => __awaiter(this, void 0, void 0, function* () {
                        const scriptv = yield core_1.Helpers.parseInteractionOutput(script);
                        debug("running script", scriptv);
                        this.runScript(scriptv);
                        return undefined;
                    }));
                    thing.setPropertyReadHandler("things", () => __awaiter(this, void 0, void 0, function* () {
                        debug("returnings things");
                        return this.getThings();
                    }));
                    thing
                        .expose()
                        .then(() => {
                        resolve(myWoT);
                    })
                        .catch((err) => reject(err));
                });
            })
                .catch((err) => reject(err));
        });
    }
    shutdown() {
        const _super = Object.create(null, {
            shutdown: { get: () => super.shutdown }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.shutdown.call(this);
            this.uncaughtListeners.forEach((listener) => {
                process.removeListener("uncaughtException", listener);
            });
        });
    }
    setLogLevel(logLevel) {
        if (logLevel === "error" || logLevel === 0) {
            console.warn = () => {
            };
            console.info = () => {
            };
            console.debug = () => {
            };
            this.logLevel = "error";
        }
        else if (logLevel === "warn" || logLevel === "warning" || logLevel === 1) {
            console.warn = this.loggers.warn;
            console.info = () => {
            };
            console.debug = () => {
            };
            this.logLevel = "warn";
        }
        else if (logLevel === "info" || logLevel === 2) {
            console.warn = this.loggers.warn;
            console.info = this.loggers.info;
            console.debug = () => {
            };
            this.logLevel = "info";
        }
        else if (logLevel === "debug" || logLevel === 3) {
            console.warn = this.loggers.warn;
            console.info = this.loggers.info;
            console.debug = this.loggers.debug;
            this.logLevel = "debug";
        }
        else {
            console.warn = this.loggers.warn;
            console.info = this.loggers.info;
            console.debug = () => {
            };
            this.logLevel = "info";
        }
    }
}
exports.default = DefaultServient;
DefaultServient.defaultConfig = {
    servient: {
        clientOnly: false,
        scriptAction: false,
    },
    http: {
        port: 8080,
        allowSelfSigned: false,
    },
    coap: {
        port: 5683,
    },
    log: {
        level: "info",
    },
};
//# sourceMappingURL=cli-default-servient.js.map