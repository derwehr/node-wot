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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataType = void 0;
const TD = __importStar(require("@node-wot/td-tools"));
const exposed_thing_1 = __importDefault(require("./exposed-thing"));
const consumed_thing_1 = __importDefault(require("./consumed-thing"));
const helpers_1 = __importDefault(require("./helpers"));
const logger_1 = require("./logger");
const content_serdes_1 = __importDefault(require("./content-serdes"));
const validation_1 = require("./validation");
const util_1 = require("util");
const { debug } = (0, logger_1.createLoggers)("core", "wot-impl");
class ThingDiscoveryProcess {
    constructor(directory, filter) {
        this.directory = directory;
        this.filter = filter;
        this.filter = filter;
        this.done = false;
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.done = true;
        });
    }
    [Symbol.asyncIterator]() {
        return __asyncGenerator(this, arguments, function* _a() {
            let rawThingDescriptions;
            try {
                const thingsPropertyOutput = yield __await(this.directory.readProperty("things"));
                rawThingDescriptions = (yield __await(thingsPropertyOutput.value()));
            }
            catch (error) {
                this.error = error instanceof Error ? error : new Error((0, util_1.inspect)(error));
                this.done = true;
                return yield __await(void 0);
            }
            for (const outputValue of rawThingDescriptions) {
                if (this.done) {
                    return yield __await(void 0);
                }
                if (!(0, validation_1.isThingDescription)(outputValue)) {
                    this.error = (0, validation_1.getLastValidationErrors)();
                    continue;
                }
                yield yield __await(outputValue);
            }
            this.done = true;
        });
    }
}
class WoTImpl {
    constructor(srv) {
        this.srv = srv;
    }
    discover(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented");
        });
    }
    exploreDirectory(url, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const directoyThingDescription = yield this.requestThingDescription(url);
            const consumedDirectoy = yield this.consume(directoyThingDescription);
            return new ThingDiscoveryProcess(consumedDirectoy, filter);
        });
    }
    requestThingDescription(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const uriScheme = helpers_1.default.extractScheme(url);
            const client = this.srv.getClientFor(uriScheme);
            const content = yield client.requestThingDescription(url);
            const value = content_serdes_1.default.contentToValue({ type: content.type, body: yield content.toBuffer() }, {});
            if ((0, validation_1.isThingDescription)(value)) {
                return value;
            }
            throw (0, validation_1.getLastValidationErrors)();
        });
    }
    consume(td) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const thing = TD.parseTD(JSON.stringify(td), true);
                const newThing = new consumed_thing_1.default(this.srv, thing);
                debug(`WoTImpl consuming TD ${newThing.id != null ? `'${newThing.id}'` : "without id"} to instantiate ConsumedThing '${newThing.title}'`);
                return newThing;
            }
            catch (err) {
                throw new Error(`Cannot consume TD because ${err instanceof Error ? err.message : err}`);
            }
        });
    }
    produce(init) {
        return new Promise((resolve, reject) => {
            try {
                const validated = helpers_1.default.validateExposedThingInit(init);
                if (!validated.valid) {
                    throw new Error("Thing Description JSON schema validation failed:\n" + validated.errors);
                }
                const newThing = new exposed_thing_1.default(this.srv, init);
                debug(`WoTImpl producing new ExposedThing '${newThing.title}'`);
                if (this.srv.addThing(newThing)) {
                    resolve(newThing);
                }
                else {
                    throw new Error("Thing already exists: " + newThing.title);
                }
            }
            catch (err) {
                reject(new Error(`Cannot produce ExposedThing because " + ${err instanceof Error ? err.message : err}`));
            }
        });
    }
}
exports.default = WoTImpl;
var DataType;
(function (DataType) {
    DataType["boolean"] = "boolean";
    DataType["number"] = "number";
    DataType["integer"] = "integer";
    DataType["string"] = "string";
    DataType["object"] = "object";
    DataType["array"] = "array";
    DataType["null"] = "null";
})(DataType = exports.DataType || (exports.DataType = {}));
//# sourceMappingURL=wot-impl.js.map