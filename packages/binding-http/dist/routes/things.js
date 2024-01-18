"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
function thingsRoute(req, res, _params) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", core_1.ContentSerdes.DEFAULT);
    res.writeHead(200);
    const list = [];
    for (const address of core_1.Helpers.getAddresses()) {
        for (const name in this.getThings()) {
            if (name) {
                list.push(this.scheme +
                    "://" +
                    core_1.Helpers.toUriLiteral(address) +
                    ":" +
                    this.getPort() +
                    "/" +
                    encodeURIComponent(name));
            }
        }
    }
    res.end(JSON.stringify(list));
}
exports.default = thingsRoute;
//# sourceMappingURL=things.js.map