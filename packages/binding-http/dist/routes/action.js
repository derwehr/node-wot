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
const { error, warn } = (0, core_1.createLoggers)("binding-http", "routes", "action");
function actionRoute(req, res, _params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_params.thing === undefined || _params.action === undefined) {
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
        const contentTypeHeader = req.headers["content-type"];
        let contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
        try {
            contentType = (0, common_1.validOrDefaultRequestContentType)(req, res, contentType);
        }
        catch (error) {
            warn(`HttpServer received unsupported Content-Type from ${core_1.Helpers.toUriLiteral(req.socket.remoteAddress)}:${req.socket.remotePort}`);
            res.writeHead(415);
            res.end("Unsupported Media Type");
            return;
        }
        const action = thing.actions[_params.action];
        if (action == null) {
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
        if (req.method === "POST") {
            const options = {
                formIndex: core_1.ProtocolHelpers.findRequestMatchingFormIndex(action.forms, this.scheme, req.url, contentType),
            };
            const uriVariables = core_1.Helpers.parseUrlParameters(req.url, thing.uriVariables, action.uriVariables);
            if (!(0, common_1.isEmpty)(uriVariables)) {
                options.uriVariables = uriVariables;
            }
            try {
                const output = yield thing.handleInvokeAction(_params.action, new core_1.Content(contentType, req), options);
                if (output != null) {
                    res.setHeader("Content-Type", output.type);
                    res.writeHead(200);
                    output.body.pipe(res);
                }
                else {
                    res.writeHead(204);
                    res.end();
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : JSON.stringify(err);
                error(`HttpServer on port ${this.getPort()} got internal error on invoke '${req.url}': ${message}`);
                res.writeHead(500);
                res.end(message);
            }
        }
        else {
            (0, common_1.respondUnallowedMethod)(req, res, "POST", corsPreflightWithCredentials);
        }
    });
}
exports.default = actionRoute;
//# sourceMappingURL=action.js.map