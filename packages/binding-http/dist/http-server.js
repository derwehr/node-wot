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
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const basic_auth_1 = __importDefault(require("basic-auth"));
const TD = __importStar(require("@node-wot/td-tools"));
const core_1 = require("@node-wot/core");
const oauth_token_validation_1 = __importDefault(require("./oauth-token-validation"));
const slugify_1 = __importDefault(require("slugify"));
const find_my_way_1 = __importDefault(require("find-my-way"));
const things_1 = __importDefault(require("./routes/things"));
const thing_description_1 = __importDefault(require("./routes/thing-description"));
const property_1 = __importDefault(require("./routes/property"));
const action_1 = __importDefault(require("./routes/action"));
const event_1 = __importDefault(require("./routes/event"));
const properties_1 = __importDefault(require("./routes/properties"));
const property_observe_1 = __importDefault(require("./routes/property-observe"));
const { debug, info, warn, error } = (0, core_1.createLoggers)("binding-http", "http-server");
class HttpServer {
    constructor(config = {}) {
        var _a, _b, _c;
        this.PROPERTY_DIR = "properties";
        this.ACTION_DIR = "actions";
        this.EVENT_DIR = "events";
        this.OBSERVABLE_DIR = "observable";
        this.supportedSecuritySchemes = ["nosec"];
        this.validOAuthClients = /.*/g;
        this.things = new Map();
        this.servient = null;
        this.oAuthValidator = undefined;
        if (typeof config !== "object") {
            throw new Error(`HttpServer requires config object (got ${typeof config})`);
        }
        this.port = (_b = (_a = this.obtainEnvironmentPortNumber()) !== null && _a !== void 0 ? _a : config.port) !== null && _b !== void 0 ? _b : 8080;
        this.address = config.address;
        this.baseUri = config.baseUri;
        this.urlRewrite = config.urlRewrite;
        this.middleware = config.middleware;
        const router = (0, find_my_way_1.default)({
            ignoreTrailingSlash: true,
            defaultRoute(req, res) {
                const pathname = req.url;
                if (config.urlRewrite) {
                    const entryUrl = pathname;
                    const internalUrl = config.urlRewrite[entryUrl !== null && entryUrl !== void 0 ? entryUrl : "/"];
                    if (internalUrl) {
                        req.url = internalUrl;
                        router.lookup(req, res, this);
                        debug("[binding-http]", `URL "${entryUrl}" has been rewritten to "${pathname}"`);
                        return;
                    }
                }
                res.writeHead(404);
                res.end("Not Found");
            },
        });
        this.router = router;
        this.router.get("/", things_1.default);
        this.router.get("/:thing", thing_description_1.default);
        this.router.on(["GET", "HEAD", "OPTIONS"], "/:thing/" + this.PROPERTY_DIR, properties_1.default);
        this.router.on(["GET", "PUT", "HEAD", "OPTIONS"], "/:thing/" + this.PROPERTY_DIR + "/:property", property_1.default);
        this.router.on(["GET", "HEAD", "OPTIONS"], "/:thing/" + this.PROPERTY_DIR + "/:property/" + this.OBSERVABLE_DIR, property_observe_1.default);
        this.router.on(["POST", "OPTIONS"], "/:thing/" + this.ACTION_DIR + "/:action", action_1.default);
        this.router.on(["GET", "HEAD", "OPTIONS"], "/:thing/" + this.EVENT_DIR + "/:event", event_1.default);
        if (config.serverKey != null && config.serverCert != null) {
            const options = {};
            options.key = fs.readFileSync(config.serverKey);
            options.cert = fs.readFileSync(config.serverCert);
            this.scheme = "https";
            this.server = https.createServer(options, (req, res) => {
                if (this.middleware) {
                    this.middleware(req, res, () => {
                        this.handleRequest(req, res);
                    });
                }
                else {
                    this.handleRequest(req, res);
                }
            });
        }
        else {
            this.scheme = "http";
            this.server = http.createServer((req, res) => {
                if (this.middleware) {
                    this.middleware(req, res, () => {
                        this.handleRequest(req, res);
                    });
                }
                else {
                    this.handleRequest(req, res);
                }
            });
        }
        if (config.security) {
            if (config.security.length > 1) {
                this.supportedSecuritySchemes = [];
            }
            for (const securityScheme of config.security) {
                switch (securityScheme.scheme) {
                    case "nosec":
                    case "basic":
                    case "digest":
                    case "bearer":
                        break;
                    case "oauth2":
                        {
                            const oAuthConfig = securityScheme;
                            this.validOAuthClients = new RegExp((_c = oAuthConfig.allowedClients) !== null && _c !== void 0 ? _c : ".*");
                            this.oAuthValidator = (0, oauth_token_validation_1.default)(oAuthConfig.method);
                        }
                        break;
                    default:
                        throw new Error(`HttpServer does not support security scheme '${securityScheme.scheme}`);
                }
                this.supportedSecuritySchemes.push(securityScheme.scheme);
            }
        }
    }
    obtainEnvironmentPortNumber() {
        for (const portVariable of ["WOT_PORT", "PORT"]) {
            const environmentValue = process.env[portVariable];
            if (environmentValue == null) {
                continue;
            }
            const parsedPort = parseInt(environmentValue);
            if (isNaN(parsedPort)) {
                debug(`Ignoring environment variable ${portVariable} because it is not an integer.`);
                continue;
            }
            info(`HttpServer Port Overridden to ${parsedPort} by Environment Variable ${portVariable}`);
            return parsedPort;
        }
        return undefined;
    }
    start(servient) {
        info(`HttpServer starting on ${this.address !== undefined ? this.address + " " : ""}port ${this.port}`);
        return new Promise((resolve, reject) => {
            this.servient = servient;
            this.server.setTimeout(60 * 60 * 1000, () => {
                debug(`HttpServer on port ${this.getPort()} timed out connection`);
            });
            this.server.keepAliveTimeout = 0;
            this.server.once("error", (err) => {
                reject(err);
            });
            this.server.once("listening", () => {
                this.server.on("error", (err) => {
                    error(`HttpServer on port ${this.port} failed: ${err.message}`);
                });
                resolve();
            });
            this.server.listen(this.port, this.address);
        });
    }
    stop() {
        info(`HttpServer stopping on port ${this.getPort()}`);
        return new Promise((resolve, reject) => {
            this.server.once("error", (err) => {
                reject(err);
            });
            this.server.once("close", () => {
                resolve();
            });
            this.server.close();
        });
    }
    getServer() {
        return this.server;
    }
    getThings() {
        return this.things;
    }
    getPort() {
        var _a, _b;
        const address = (_a = this.server) === null || _a === void 0 ? void 0 : _a.address();
        if (typeof address === "object") {
            return (_b = address === null || address === void 0 ? void 0 : address.port) !== null && _b !== void 0 ? _b : -1;
        }
        const port = parseInt(address);
        if (isNaN(port)) {
            return -1;
        }
        return port;
    }
    expose(thing, tdTemplate = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let urlPath = (0, slugify_1.default)(thing.title, { lower: true });
            if (this.things.has(urlPath)) {
                urlPath = core_1.Helpers.generateUniqueName(urlPath);
            }
            if (this.getPort() !== -1) {
                debug(`HttpServer on port ${this.getPort()} exposes '${thing.title}' as unique '/${urlPath}'`);
                this.things.set(urlPath, thing);
                if (this.baseUri !== undefined) {
                    const base = this.baseUri.concat("/", encodeURIComponent(urlPath));
                    info("HttpServer TD hrefs using baseUri " + this.baseUri);
                    this.addEndpoint(thing, tdTemplate, base);
                }
                else {
                    for (const address of core_1.Helpers.getAddresses()) {
                        const base = this.scheme + "://" + address + ":" + this.getPort() + "/" + encodeURIComponent(urlPath);
                        this.addEndpoint(thing, tdTemplate, base);
                    }
                    if (this.scheme === "http" && Object.keys(thing.securityDefinitions).length !== 0) {
                        warn(`HTTP Server will attempt to use your security schemes even if you are not using HTTPS.`);
                    }
                    this.fillSecurityScheme(thing);
                }
            }
        });
    }
    destroy(thingId) {
        return __awaiter(this, void 0, void 0, function* () {
            debug(`HttpServer on port ${this.getPort()} destroying thingId '${thingId}'`);
            for (const [name, thing] of this.things.entries()) {
                if (thing.id === thingId) {
                    this.things.delete(name);
                    info(`HttpServer successfully destroyed '${thing.title}'`);
                    return true;
                }
            }
            info(`HttpServer failed to destroy thing with thingId '${thingId}'`);
            return false;
        });
    }
    addUrlRewriteEndpoints(form, forms) {
        if (this.urlRewrite != null) {
            for (const [inUri, toUri] of Object.entries(this.urlRewrite)) {
                const endsWithToUri = form.href.endsWith(toUri);
                if (endsWithToUri) {
                    const form2 = structuredClone(form);
                    form2.href = form2.href.substring(0, form.href.lastIndexOf(toUri)) + inUri;
                    forms.push(form2);
                    debug(`HttpServer on port ${this.getPort()} assigns urlRewrite '${form2.href}' for '${form.href}'`);
                }
            }
        }
    }
    addEndpoint(thing, tdTemplate, base) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        for (const type of core_1.ContentSerdes.get().getOfferedMediaTypes()) {
            const properties = Object.values(thing.properties);
            let allReadOnly = true;
            let allWriteOnly = true;
            for (const property of properties) {
                const readOnly = (_a = property.readOnly) !== null && _a !== void 0 ? _a : false;
                if (!readOnly) {
                    allReadOnly = false;
                }
                const writeOnly = (_b = property.writeOnly) !== null && _b !== void 0 ? _b : false;
                if (!writeOnly) {
                    allWriteOnly = false;
                }
            }
            if (properties.length > 0) {
                const href = base + "/" + this.PROPERTY_DIR;
                const form = new TD.Form(href, type);
                if (allReadOnly && !allWriteOnly) {
                    form.op = ["readallproperties", "readmultipleproperties"];
                }
                else if (allWriteOnly && !allReadOnly) {
                    form.op = ["writeallproperties", "writemultipleproperties"];
                }
                else {
                    form.op = [
                        "readallproperties",
                        "readmultipleproperties",
                        "writeallproperties",
                        "writemultipleproperties",
                    ];
                }
                if (thing.forms == null) {
                    thing.forms = [];
                }
                thing.forms.push(form);
                this.addUrlRewriteEndpoints(form, thing.forms);
            }
            for (const [propertyName, property] of Object.entries(thing.properties)) {
                const propertyNamePattern = core_1.Helpers.updateInteractionNameWithUriVariablePattern(propertyName, property.uriVariables, thing.uriVariables);
                const href = base + "/" + this.PROPERTY_DIR + "/" + propertyNamePattern;
                const form = new TD.Form(href, type);
                core_1.ProtocolHelpers.updatePropertyFormWithTemplate(form, ((_d = (_c = tdTemplate.properties) === null || _c === void 0 ? void 0 : _c[propertyName]) !== null && _d !== void 0 ? _d : {}));
                const readOnly = (_e = property.readOnly) !== null && _e !== void 0 ? _e : false;
                const writeOnly = (_f = property.writeOnly) !== null && _f !== void 0 ? _f : false;
                if (readOnly) {
                    form.op = ["readproperty"];
                    const hform = form;
                    (_g = hform["htv:methodName"]) !== null && _g !== void 0 ? _g : (hform["htv:methodName"] = "GET");
                }
                else if (writeOnly) {
                    form.op = ["writeproperty"];
                    const hform = form;
                    (_h = hform["htv:methodName"]) !== null && _h !== void 0 ? _h : (hform["htv:methodName"] = "PUT");
                }
                else {
                    form.op = ["readproperty", "writeproperty"];
                }
                property.forms.push(form);
                debug(`HttpServer on port ${this.getPort()} assigns '${href}' to Property '${propertyName}'`);
                this.addUrlRewriteEndpoints(form, property.forms);
                if (property.observable === true) {
                    const href = base +
                        "/" +
                        this.PROPERTY_DIR +
                        "/" +
                        encodeURIComponent(propertyName) +
                        "/" +
                        this.OBSERVABLE_DIR;
                    const form = new TD.Form(href, type);
                    form.op = ["observeproperty", "unobserveproperty"];
                    form.subprotocol = "longpoll";
                    property.forms.push(form);
                    debug(`HttpServer on port ${this.getPort()} assigns '${href}' to observable Property '${propertyName}'`);
                    this.addUrlRewriteEndpoints(form, property.forms);
                }
            }
            for (const [actionName, action] of Object.entries(thing.actions)) {
                const actionNamePattern = core_1.Helpers.updateInteractionNameWithUriVariablePattern(actionName, action.uriVariables, thing.uriVariables);
                const href = base + "/" + this.ACTION_DIR + "/" + actionNamePattern;
                const form = new TD.Form(href, type);
                core_1.ProtocolHelpers.updateActionFormWithTemplate(form, ((_k = (_j = tdTemplate.actions) === null || _j === void 0 ? void 0 : _j[actionName]) !== null && _k !== void 0 ? _k : {}));
                form.op = ["invokeaction"];
                const hform = form;
                (_l = hform["htv:methodName"]) !== null && _l !== void 0 ? _l : (hform["htv:methodName"] = "POST");
                action.forms.push(form);
                debug(`HttpServer on port ${this.getPort()} assigns '${href}' to Action '${actionName}'`);
                this.addUrlRewriteEndpoints(form, action.forms);
            }
            for (const [eventName, event] of Object.entries(thing.events)) {
                const eventNamePattern = core_1.Helpers.updateInteractionNameWithUriVariablePattern(eventName, event.uriVariables, thing.uriVariables);
                const href = base + "/" + this.EVENT_DIR + "/" + eventNamePattern;
                const form = new TD.Form(href, type);
                core_1.ProtocolHelpers.updateEventFormWithTemplate(form, ((_o = (_m = tdTemplate.events) === null || _m === void 0 ? void 0 : _m[eventName]) !== null && _o !== void 0 ? _o : {}));
                form.subprotocol = "longpoll";
                form.op = ["subscribeevent", "unsubscribeevent"];
                event.forms.push(form);
                debug(`HttpServer on port ${this.getPort()} assigns '${href}' to Event '${eventName}'`);
                this.addUrlRewriteEndpoints(form, event.forms);
            }
        }
    }
    checkCredentials(thing, req) {
        return __awaiter(this, void 0, void 0, function* () {
            debug(`HttpServer on port ${this.getPort()} checking credentials for '${thing.id}'`);
            if (this.servient === null) {
                throw new Error("Servient not set");
            }
            const credentials = this.servient.retrieveCredentials(thing.id);
            const selected = core_1.Helpers.toStringArray(thing.security)[0];
            const thingSecurityScheme = thing.securityDefinitions[selected];
            debug(`Verifying credentials with security scheme '${thingSecurityScheme.scheme}'`);
            switch (thingSecurityScheme.scheme) {
                case "nosec":
                    return true;
                case "basic": {
                    const basic = (0, basic_auth_1.default)(req);
                    if (basic === undefined)
                        return false;
                    if (credentials == null || credentials.length === 0)
                        return false;
                    const basicCredentials = credentials;
                    return basicCredentials.some((cred) => basic.name === cred.username && basic.pass === cred.password);
                }
                case "digest":
                    return false;
                case "oauth2": {
                    const oAuthScheme = thing.securityDefinitions[thing.security[0]];
                    const scopes = core_1.Helpers.toStringArray(oAuthScheme.scopes);
                    let valid = false;
                    if (!this.oAuthValidator) {
                        throw new Error("OAuth validator not set. Cannot validate request.");
                    }
                    try {
                        valid = yield this.oAuthValidator.validate(req, scopes, this.validOAuthClients);
                    }
                    catch (err) {
                        error("OAuth authorization error; sending unauthorized response error");
                        error("this was possibly caused by a misconfiguration of the server");
                        error(`${err}`);
                    }
                    return valid;
                }
                case "Bearer": {
                    if (req.headers.authorization === undefined)
                        return false;
                    const auth = req.headers.authorization.split(" ");
                    if (auth.length !== 2 || auth[0] !== "Bearer")
                        return false;
                    if (credentials == null || credentials.length === 0)
                        return false;
                    const bearerCredentials = credentials;
                    return bearerCredentials.some((cred) => cred.token === auth[1]);
                }
                default:
                    return false;
            }
        });
    }
    fillSecurityScheme(thing) {
        var _a;
        if (thing.security.length > 0) {
            const securityScheme = core_1.Helpers.toStringArray(thing.security)[0];
            const secCandidate = Object.keys(thing.securityDefinitions).find((key) => {
                return key === securityScheme;
            });
            if (secCandidate == null) {
                throw new Error("Security scheme not found in thing security definitions. Thing security definitions: " +
                    Object.keys(thing.securityDefinitions).join(", "));
            }
            const isSupported = this.supportedSecuritySchemes.find((supportedScheme) => {
                const thingScheme = thing.securityDefinitions[secCandidate].scheme;
                return thingScheme === supportedScheme.toLocaleLowerCase();
            });
            if (isSupported == null) {
                throw new Error("Servient does not support thing security schemes. Current scheme supported: " +
                    this.supportedSecuritySchemes.join(", "));
            }
            return;
        }
        if (Object.keys((_a = thing.securityDefinitions) !== null && _a !== void 0 ? _a : {}).length === 0) {
            thing.securityDefinitions = {
                [this.supportedSecuritySchemes[0]]: { scheme: this.supportedSecuritySchemes[0] },
            };
            thing.security = [this.supportedSecuritySchemes[0]];
            return;
        }
        const secCandidate = Object.keys(thing.securityDefinitions).find((key) => {
            let scheme = thing.securityDefinitions[key].scheme;
            scheme = scheme === "oauth2" ? scheme.split("2")[0] : scheme;
            return this.supportedSecuritySchemes.includes(scheme.toLocaleLowerCase());
        });
        if (secCandidate == null) {
            throw new Error("Servient does not support any of thing security schemes. Current scheme supported: " +
                this.supportedSecuritySchemes.join(",") +
                " thing security schemes: " +
                Object.values(thing.securityDefinitions)
                    .map((schemeDef) => schemeDef.scheme)
                    .join(", "));
        }
        const selectedSecurityScheme = thing.securityDefinitions[secCandidate];
        thing.securityDefinitions = {};
        thing.securityDefinitions[secCandidate] = selectedSecurityScheme;
        thing.security = [secCandidate];
    }
    handleRequest(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const requestUri = new URL((_a = req.url) !== null && _a !== void 0 ? _a : "", `${this.scheme}://${req.headers.host}`);
            debug(`HttpServer on port ${this.getPort()} received '${req.method} ${requestUri.pathname}' from ${core_1.Helpers.toUriLiteral(req.socket.remoteAddress)}:${req.socket.remotePort}`);
            res.on("finish", () => {
                debug(`HttpServer on port ${this.getPort()} replied with '${res.statusCode}' to ${core_1.Helpers.toUriLiteral(req.socket.remoteAddress)}:${req.socket.remotePort}`);
            });
            const contentTypeHeader = req.headers["content-type"];
            let contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
            if (req.method === "PUT" || req.method === "POST") {
                if (!contentType) {
                    warn(`HttpServer on port ${this.getPort()} received no Content-Type from ${core_1.Helpers.toUriLiteral(req.socket.remoteAddress)}:${req.socket.remotePort}`);
                    contentType = core_1.ContentSerdes.DEFAULT;
                }
                else if (core_1.ContentSerdes.get().getSupportedMediaTypes().indexOf(core_1.ContentSerdes.getMediaType(contentType)) < 0) {
                    res.writeHead(415);
                    res.end("Unsupported Media Type");
                    return;
                }
            }
            this.router.lookup(req, res, this);
        });
    }
}
exports.default = HttpServer;
//# sourceMappingURL=http-server.js.map