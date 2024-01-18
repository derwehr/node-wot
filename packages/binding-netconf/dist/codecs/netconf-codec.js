"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const url_parse_1 = __importDefault(require("url-parse"));
const debug = (0, core_1.createDebugLogger)("binding-netconf", "netconf-codec");
class NetconfCodec {
    getMediaType() {
        return "application/yang-data+xml";
    }
    bytesToValue(bytes, schema, parameters) {
        var _a;
        debug(`NetconfCodec parsing '${bytes.toString()}'`);
        try {
            let parsed = JSON.parse(bytes.toString());
            const reply = parsed.rpc_reply.data;
            let leaf = schema;
            const form = leaf.forms[0];
            leaf = form.href.split("/").splice(-1, 1);
            leaf = leaf[0].replace(/\[(.*?)\]/g, "");
            if (leaf == null) {
                throw new Error(`The href specified in TD is missing the leaf node in the Xpath`);
            }
            const url = new url_parse_1.default(form.href);
            const xpathQuery = url.pathname;
            const tree = xpathQuery.split("/").map((value, index) => {
                var _a;
                const val = value.replace(/\[(.*?)\]/g, "").split(":");
                return (_a = val[1]) !== null && _a !== void 0 ? _a : val[0];
            });
            let value = reply;
            for (const el of tree) {
                if (el === "") {
                    continue;
                }
                value = value[el];
            }
            const tmpSchema = schema;
            if (!("type" in tmpSchema)) {
                throw new Error(`TD is missing the schema type`);
            }
            if (tmpSchema.type === "object") {
                if (tmpSchema["xml:container"] != null && ((_a = tmpSchema === null || tmpSchema === void 0 ? void 0 : tmpSchema.properties) === null || _a === void 0 ? void 0 : _a.xmlns["xml:attribute"]) != null) {
                    parsed = {};
                    const xmlnsKey = Object.keys(value.$)[0];
                    parsed.xmlns = value.$[xmlnsKey];
                    parsed.value = value._.split(":")[1];
                }
            }
            else {
                parsed = value;
            }
            return parsed;
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                if (bytes.byteLength === 0) {
                    return null;
                }
                else {
                    return bytes.toString();
                }
            }
            else {
                throw err;
            }
        }
    }
    valueToBytes(value, schema, parameters) {
        debug(`NetconfCodec serializing ${value}`);
        let body = "";
        if (value !== undefined) {
            const NSs = {};
            let leaf = schema.forms[0].href.split("/").splice(-1, 1);
            leaf = leaf[0].replace(/\[(.*?)\]/g, "");
            if (leaf == null) {
                throw new Error(`The href specified in TD is missing the leaf node in the Xpath`);
            }
            const tmpObj = this.getPayloadNamespaces(schema, value, NSs, false, leaf);
            body = JSON.stringify(tmpObj);
        }
        return Buffer.from(body);
    }
    getPayloadNamespaces(schema, payload, namespaces, hasNamespace, leaf) {
        var _a, _b;
        if (hasNamespace) {
            const properties = schema.properties;
            if (properties == null) {
                throw new Error(`Missing "properties" field in TD`);
            }
            let nsFound = false;
            let aliasNs = "";
            let value;
            for (const key in properties) {
                const el = properties[key];
                const payloadField = payload[key];
                if (payloadField == null) {
                    throw new Error(`Payload is missing '${key}' field specified in TD`);
                }
                if (el["xml:attribute"] === true) {
                    const ns = payload[key];
                    aliasNs = ns.split(":")[ns.split(":").length - 1];
                    namespaces[aliasNs] = payload[key];
                    nsFound = true;
                }
                value = payloadField;
            }
            if (!nsFound) {
                throw new Error(`Namespace not found in the payload`);
            }
            else {
                payload = { [leaf]: aliasNs + "\\" + ":" + value };
            }
            return { payload, namespaces };
        }
        if ((schema === null || schema === void 0 ? void 0 : schema.type) === "object" && schema.properties != null) {
            let tmpObj;
            if (schema["xml:container"] != null) {
                tmpObj = this.getPayloadNamespaces(schema, payload, namespaces, true, leaf);
            }
            else {
                tmpObj = this.getPayloadNamespaces(schema.properties, payload, namespaces, false, leaf);
            }
            payload = tmpObj.payload;
            namespaces = Object.assign(Object.assign({}, namespaces), tmpObj.namespaces);
        }
        for (const key in schema) {
            if (((_a = schema[key]) === null || _a === void 0 ? void 0 : _a.type) === "object" || hasNamespace) {
                let tmpHasNamespace = false;
                if (((_b = schema[key]) === null || _b === void 0 ? void 0 : _b.properties) != null && schema[key]["xml:container"] != null) {
                    tmpHasNamespace = true;
                }
                const tmpObj = this.getPayloadNamespaces(schema[key], payload[key], namespaces, tmpHasNamespace, leaf);
                payload[key] = tmpObj.payload;
                namespaces = Object.assign(Object.assign({}, namespaces), tmpObj.namespaces);
            }
        }
        return { payload, namespaces };
    }
}
exports.default = NetconfCodec;
//# sourceMappingURL=netconf-codec.js.map