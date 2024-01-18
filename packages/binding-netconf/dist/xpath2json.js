"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLeaves = exports.xpath2json = exports.json2xpath = exports.isPlainObject = void 0;
function isPlainObject(a) {
    return typeof a === "object" && a !== null && !Array.isArray(a) && !(a instanceof Date);
}
exports.isPlainObject = isPlainObject;
function json2xpath(json, index, str) {
    if (!isPlainObject(json)) {
        return str;
    }
    const keys = Object.keys(json);
    for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        if (key === "$") {
            const tmp = json[key].xmlns;
            const ns = tmp.split(":")[tmp.split(":").length - 1];
            str.splice(index - 3, 0, ns + ":");
            index++;
            continue;
        }
        else if (json[key] != null && !isPlainObject(json[key])) {
            const val = json[key];
            if (j === 0) {
                str.pop();
            }
            str.push("[");
            str.push(key);
            str.push("=");
            str.push('"');
            str.push(val);
            str.push('"');
            str.push("]");
            continue;
        }
        str.push(key);
        str.push("/");
        index++;
        str = json2xpath(json[key], index, str);
    }
    return str;
}
exports.json2xpath = json2xpath;
function xpath2json(xpath, namespaces) {
    var _a, _b;
    const subStrings = xpath.split("/");
    let obj = {};
    let tmpObj = {};
    for (let i = subStrings.length - 1; i > -1; i--) {
        let sub = subStrings[i];
        if (sub === "") {
            continue;
        }
        let rootNamespace = null;
        let key = null;
        tmpObj = {};
        const reg = /\[(.*?)\]/g;
        if (sub.replace(reg, "").split(":").length > 1 && i === 1) {
            rootNamespace = sub.replace(reg, "").split(":")[0];
            key = sub.replace(reg, "").split(":")[1];
            sub = sub.replace(rootNamespace + ":", "");
            const $ = {};
            if (!(rootNamespace in namespaces)) {
                throw new Error(`Namespace for ${rootNamespace} not specified in the TD`);
            }
            $.xmlns = namespaces[rootNamespace];
            tmpObj[key] = {};
            tmpObj[key].$ = $;
        }
        const values = sub.match(reg);
        if (values) {
            sub = sub.replace(/\[[^\]]*\]/g, "");
            (_a = tmpObj[sub]) !== null && _a !== void 0 ? _a : (tmpObj[sub] = {});
            for (let j = 0; j < values.length; j++) {
                let val = values[j];
                val = val.replace(/[[\]']+/g, "");
                key = val.split("=")[0];
                val = val.split("=")[1];
                val = val.replace(/['"]+/g, "");
                tmpObj[sub][key] = val;
                if (val.split("\\:").length > 1 && i > 1) {
                    const nsKey = val.split("\\:")[0];
                    val = val.replace(/[\\]+/g, "");
                    if (!(nsKey in namespaces)) {
                        throw new Error(`Namespace for ${nsKey} not specified in the TD`);
                    }
                    const ns = namespaces[nsKey];
                    const xmlnsKey = "xmlns:" + nsKey;
                    tmpObj[sub][key] = { $: { [xmlnsKey]: ns }, _: val };
                }
            }
        }
        if (sub.split(":").length > 1 && i > 1) {
            const nsKey = sub.split(":")[0];
            const val = sub.split(":")[1];
            if (!(sub in tmpObj)) {
                tmpObj[val] = {};
            }
            else {
                const newObject = {};
                delete Object.assign(newObject, tmpObj, { [val]: tmpObj[sub] })[sub];
                tmpObj = newObject;
            }
            sub = val;
            tmpObj[sub].$ = {};
            if (!(nsKey in namespaces)) {
                throw new Error(`Namespace for ${nsKey} not specified in the TD`);
            }
            tmpObj[sub].$.xmlns = namespaces[nsKey];
        }
        tmpObj[sub] = Object.assign((_b = tmpObj[sub]) !== null && _b !== void 0 ? _b : {}, obj);
        obj = tmpObj;
    }
    return obj;
}
exports.xpath2json = xpath2json;
function addLeaves(xpath, payload) {
    if (!isPlainObject(payload)) {
        return xpath;
    }
    const jsonString = json2xpath(payload, 0, []);
    const jsonXpath = jsonString.join("");
    if (xpath.split("/").length > 2) {
        const lastEl = xpath.split("/").splice(-1, 1);
        xpath = xpath.replace("/" + lastEl[0], "");
    }
    return xpath + jsonXpath;
}
exports.addLeaves = addLeaves;
//# sourceMappingURL=xpath2json.js.map