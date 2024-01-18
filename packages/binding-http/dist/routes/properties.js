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
const common_1 = require("./common");
const { error } = (0, core_1.createLoggers)("binding-http", "routes", "properties");
function propertiesRoute(req, res, _params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_params.thing === undefined) {
            res.writeHead(400);
            res.end();
            return;
        }
        const thing = this.getThings().get(_params.thing);
        if (thing == null) {
            res.writeHead(404);
            res.end();
            return;
        }
        (0, common_1.setCorsForThing)(req, res, thing);
        let corsPreflightWithCredentials = false;
        const securityScheme = thing.securityDefinitions[core_1.Helpers.toStringArray(thing.security)[0]].scheme;
        if (securityScheme !== "nosec" && !(yield this.checkCredentials(thing, req))) {
            if (req.method === "OPTIONS" && req.headers.origin != null) {
                corsPreflightWithCredentials = true;
            }
            else {
                res.setHeader("WWW-Authenticate", `${(0, common_1.securitySchemeToHttpHeader)(securityScheme)} realm="${thing.id}"`);
                res.writeHead(401);
                res.end();
                return;
            }
        }
        if (req.method === "GET") {
            try {
                const propMap = yield thing.handleReadAllProperties({
                    formIndex: 0,
                });
                res.setHeader("Content-Type", core_1.ContentSerdes.DEFAULT);
                res.writeHead(200);
                const recordResponse = {};
                for (const key of propMap.keys()) {
                    const content = propMap.get(key);
                    const value = core_1.ContentSerdes.get().contentToValue({ type: core_1.ContentSerdes.DEFAULT, body: yield content.toBuffer() }, {});
                    recordResponse[key] = value;
                }
                res.end(JSON.stringify(recordResponse));
            }
            catch (err) {
                const message = err instanceof Error ? err.message : JSON.stringify(err);
                error(`HttpServer on port ${this.getPort()} got internal error on invoke '${req.url}': ${message}`);
                res.writeHead(500);
                res.end(message);
            }
        }
        else if (req.method === "HEAD") {
            res.writeHead(202);
            res.end();
        }
        else {
            (0, common_1.respondUnallowedMethod)(req, res, "GET", corsPreflightWithCredentials);
        }
    });
}
exports.default = propertiesRoute;
//# sourceMappingURL=properties.js.map