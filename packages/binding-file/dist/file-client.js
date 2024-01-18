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
const fs_1 = require("fs");
const node_url_1 = require("node:url");
const { debug } = (0, core_1.createLoggers)("binding-file", "file-client");
class FileClient {
    constructor() {
        this.setSecurity = (metadata) => false;
    }
    toString() {
        return "[FileClient]";
    }
    readFromFile(uri, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, node_url_1.fileURLToPath)(uri);
            debug(`Reading file of Content-Type ${contentType} from path ${filePath}.`);
            const fileHandle = yield fs_1.promises.open(filePath);
            const body = fileHandle.createReadStream();
            return new core_1.Content(contentType, body);
        });
    }
    readResource(form) {
        return __awaiter(this, void 0, void 0, function* () {
            const formContentType = form.contentType;
            if (formContentType == null) {
                debug(`Found no Content-Type for Form, defaulting to ${core_1.ContentSerdes.DEFAULT}`);
            }
            const contentType = formContentType !== null && formContentType !== void 0 ? formContentType : core_1.ContentSerdes.DEFAULT;
            return this.readFromFile(form.href, contentType);
        });
    }
    writeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, node_url_1.fileURLToPath)(form.href);
            yield fs_1.promises.writeFile(filePath, content.body);
        });
    }
    invokeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("FileClient does not implement invoke");
        });
    }
    unlinkResource(form) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("FileClient does not implement unlink");
        });
    }
    requestThingDescription(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.readFromFile(uri, "application/td+json");
        });
    }
    subscribeResource(form, next, error, complete) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("FileClient does not implement subscribe");
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.default = FileClient;
//# sourceMappingURL=file-client.js.map