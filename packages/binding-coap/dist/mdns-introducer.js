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
exports.MdnsIntroducer = void 0;
const makeMdns = require("multicast-dns");
const os_1 = require("os");
class MdnsIntroducer {
    constructor(address, ipAddressFamily) {
        this.ipAddressFamily = ipAddressFamily !== null && ipAddressFamily !== void 0 ? ipAddressFamily : "IPv4";
        const type = ipAddressFamily === "IPv6" ? "udp6" : "udp4";
        this.mdns = makeMdns({
            ip: address,
            type,
        });
        this.mdnsEntries = new Map();
        this.mdns.on("query", (query) => {
            this.sendMdnsResponses(query);
        });
    }
    sendMdnsResponses(query) {
        this.mdnsEntries.forEach((value) => {
            const entryName = value[0].name;
            const matchingQuestions = query.questions.filter((question) => question.name === entryName);
            if (matchingQuestions.length <= 0) {
                return;
            }
            this.mdns.respond(value);
        });
    }
    determineTarget() {
        var _a;
        const interfaces = (0, os_1.networkInterfaces)();
        for (const iface in interfaces) {
            for (const entry of (_a = interfaces[iface]) !== null && _a !== void 0 ? _a : []) {
                if (entry.internal === false) {
                    if (entry.family === this.ipAddressFamily) {
                        return entry.address;
                    }
                }
            }
        }
        throw Error("Found no suitable IP address for performing MDNS introduction.");
    }
    createTxtData(parameters) {
        const txtData = [`td=${parameters.urlPath}`];
        const type = parameters.type;
        if (type != null) {
            txtData.push(`type=${type}`);
        }
        const scheme = parameters.scheme;
        if (scheme != null) {
            txtData.push(`scheme=${scheme}`);
        }
        return txtData;
    }
    registerExposedThing(thing, parameters) {
        const serviceName = parameters.serviceName;
        const instanceName = `${thing.title}.${serviceName}`;
        const target = this.determineTarget();
        const txtData = this.createTxtData(parameters);
        this.mdnsEntries.set(parameters.urlPath, [
            {
                name: serviceName,
                type: "PTR",
                data: instanceName,
            },
            {
                name: instanceName,
                type: "SRV",
                data: {
                    port: parameters.port,
                    target,
                },
            },
            {
                name: instanceName,
                type: "TXT",
                data: txtData,
            },
        ]);
    }
    delete(urlPath) {
        this.mdnsEntries.delete(urlPath);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.mdns.destroy((error) => {
                    if (error != null) {
                        reject(error);
                    }
                    resolve();
                });
            });
        });
    }
}
exports.MdnsIntroducer = MdnsIntroducer;
//# sourceMappingURL=mdns-introducer.js.map