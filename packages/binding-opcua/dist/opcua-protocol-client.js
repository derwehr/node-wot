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
exports.OPCUAProtocolClient = exports.findBasicDataTypeC = void 0;
const Subscription_1 = require("rxjs/Subscription");
const util_1 = require("util");
const stream_1 = require("stream");
const core_1 = require("@node-wot/core");
const node_opcua_client_1 = require("node-opcua-client");
const node_opcua_pseudo_session_1 = require("node-opcua-pseudo-session");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_service_translate_browse_path_1 = require("node-opcua-service-translate-browse-path");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const codec_1 = require("./codec");
const node_opcua_json_1 = require("node-opcua-json");
const node_opcua_types_1 = require("node-opcua-types");
const node_opcua_1 = require("node-opcua");
const { debug } = (0, core_1.createLoggers)("binding-opcua", "opcua-protocol-client");
function findBasicDataTypeC(session, dataTypeId, callback) {
    const resultMask = (0, node_opcua_data_model_1.makeResultMask)("ReferenceType");
    if (dataTypeId.identifierType === node_opcua_nodeid_1.NodeIdType.NUMERIC && Number(dataTypeId.value) <= 25) {
        callback(null, dataTypeId.value);
    }
    else {
        const nodeToBrowse = new node_opcua_types_1.BrowseDescription({
            browseDirection: node_opcua_data_model_1.BrowseDirection.Inverse,
            includeSubtypes: false,
            nodeId: dataTypeId,
            referenceTypeId: (0, node_opcua_nodeid_1.makeNodeId)(node_opcua_1.ReferenceTypeIds.HasSubtype),
            resultMask,
        });
        session.browse(nodeToBrowse, (err, browseResult) => {
            var _a;
            if (err) {
                return callback(err);
            }
            if (!browseResult) {
                return callback(new Error("Internal Error"));
            }
            browseResult.references = (_a = browseResult.references) !== null && _a !== void 0 ? _a : [];
            const baseDataType = browseResult.references[0].nodeId;
            return findBasicDataTypeC(session, baseDataType, callback);
        });
    }
}
exports.findBasicDataTypeC = findBasicDataTypeC;
const findBasicDataType = (0, util_1.promisify)(findBasicDataTypeC);
function _variantToJSON(variant, contentType) {
    contentType = contentType.split(";")[0];
    switch (contentType) {
        case "application/opcua+json": {
            return (0, node_opcua_json_1.opcuaJsonEncodeVariant)(variant, true);
        }
        case "application/json": {
            return (0, node_opcua_json_1.opcuaJsonEncodeVariant)(variant, false);
        }
        default: {
            throw new Error("Unsupported content type here : " + contentType);
        }
    }
}
class OPCUAProtocolClient {
    constructor() {
        this._connections = new Map();
        this._monitoredItems = new Map();
    }
    _withConnection(form, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = form.href;
            const matchesScheme = (endpoint === null || endpoint === void 0 ? void 0 : endpoint.match(/^opc.tcp:\/\//)) != null;
            if (!matchesScheme) {
                debug(`invalid opcua:endpoint ${endpoint} specified`);
                throw new Error("Invalid OPCUA endpoint " + endpoint);
            }
            let c = this._connections.get(endpoint);
            if (!c) {
                const client = node_opcua_client_1.OPCUAClient.create({
                    endpointMustExist: false,
                    connectionStrategy: {
                        maxRetry: 1,
                    },
                });
                client.on("backoff", () => {
                    debug(`connection:backoff: cannot connection to  ${endpoint}`);
                });
                c = {
                    client,
                    pending: [],
                };
                this._connections.set(endpoint, c);
                try {
                    yield client.connect(endpoint);
                    const session = yield client.createSession();
                    c.session = session;
                    const subscription = yield session.createSubscription2({
                        maxNotificationsPerPublish: 100,
                        publishingEnabled: true,
                        requestedLifetimeCount: 100,
                        requestedPublishingInterval: 250,
                        requestedMaxKeepAliveCount: 10,
                        priority: 1,
                    });
                    c.subscription = subscription;
                    const p = c.pending;
                    c.pending = undefined;
                    p && p.forEach((t) => t());
                    this._connections.set(endpoint, c);
                }
                catch (err) {
                    throw new Error("Cannot connected to endpoint " + endpoint + "\nmsg = " + err.message);
                }
            }
            if (c.pending) {
                yield new Promise((resolve) => {
                    var _a;
                    (_a = c === null || c === void 0 ? void 0 : c.pending) === null || _a === void 0 ? void 0 : _a.push(resolve);
                });
            }
            return next(c);
        });
    }
    _withSession(form, next) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._withConnection(form, (c) => __awaiter(this, void 0, void 0, function* () {
                return next(c.session);
            }));
        });
    }
    _withSubscription(form, next) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._withConnection(form, (c) => __awaiter(this, void 0, void 0, function* () {
                return next(c.session, c.subscription);
            }));
        });
    }
    _resolveNodeId2(form, fNodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fNodeId instanceof node_opcua_nodeid_1.NodeId) {
                return fNodeId;
            }
            else if (fNodeId.root != null) {
                const f = fNodeId;
                const r = f.root;
                const rootNodeId = (0, node_opcua_nodeid_1.resolveNodeId)(r);
                const nodeId = this._withSession(form, (session) => __awaiter(this, void 0, void 0, function* () {
                    const path = (0, node_opcua_service_translate_browse_path_1.makeBrowsePath)(rootNodeId, f.path);
                    const result = yield session.translateBrowsePath(path);
                    if (result.statusCode !== node_opcua_status_code_1.StatusCodes.Good || !result.targets) {
                        debug(`resolveNodeId: failed to extract  ${f.path}`);
                        throw new Error(`cannot resolve nodeId from path
                    root       =${f.root}
                    path       =${f.path}
                    statusCode =${result.statusCode.toString()}`);
                    }
                    return result.targets[0].targetId;
                }));
                return nodeId;
            }
            else {
                return (0, node_opcua_nodeid_1.resolveNodeId)(fNodeId);
            }
        });
    }
    _resolveNodeId(form) {
        return __awaiter(this, void 0, void 0, function* () {
            const fNodeId = form["opcua:nodeId"];
            if (fNodeId == null) {
                debug(`resolveNodeId: form = ${form}`);
                throw new Error("form must expose a 'opcua:nodeId'");
            }
            return this._resolveNodeId2(form, fNodeId);
        });
    }
    _predictDataType(form) {
        return __awaiter(this, void 0, void 0, function* () {
            const fNodeId = form["opcua:nodeId"];
            if (fNodeId == null) {
                debug(`resolveNodeId: form = ${form}`);
                throw new Error("form must expose a 'opcua:nodeId'");
            }
            const nodeId = yield this._resolveNodeId2(form, fNodeId);
            return yield this._withSession(form, (session) => __awaiter(this, void 0, void 0, function* () {
                const dataTypeOrNull = yield (0, util_1.promisify)(node_opcua_pseudo_session_1.getBuiltInDataType)(session, nodeId);
                if (dataTypeOrNull !== null) {
                    return dataTypeOrNull;
                }
                throw new Error("cannot predict dataType for nodeId " + nodeId.toString());
            }));
        });
    }
    _resolveMethodNodeId(form) {
        return __awaiter(this, void 0, void 0, function* () {
            const fNodeId = form["opcua:method"];
            if (fNodeId == null) {
                debug(`resolveNodeId: form = ${form}`);
                throw new Error("form must expose a 'opcua:nodeId'");
            }
            return this._resolveNodeId2(form, fNodeId);
        });
    }
    readResource(form) {
        return __awaiter(this, void 0, void 0, function* () {
            debug(`readResource: reading ${form}`);
            const content = yield this._withSession(form, (session) => __awaiter(this, void 0, void 0, function* () {
                const nodeId = yield this._resolveNodeId(form);
                const dataValue = yield session.read({
                    nodeId,
                    attributeId: node_opcua_data_model_1.AttributeIds.Value,
                });
                return this._dataValueToContent(form, dataValue);
            }));
            debug(`readResource: contentType ${content.type}`);
            return content;
        });
    }
    writeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const statusCode = yield this._withSession(form, (session) => __awaiter(this, void 0, void 0, function* () {
                const nodeId = yield this._resolveNodeId(form);
                const dataValue = yield this._contentToDataValue(form, content);
                const statusCode = yield session.write({
                    nodeId,
                    attributeId: node_opcua_data_model_1.AttributeIds.Value,
                    value: dataValue,
                });
                return statusCode;
            }));
            debug(`writeResource: statusCode ${statusCode}`);
            if (statusCode !== node_opcua_status_code_1.StatusCodes.Good && !(0, node_opcua_1.isGoodish2)(statusCode, { treatUncertainAsBad: false })) {
                throw new Error("Error in OPCUA Write : " + statusCode.toString());
            }
        });
    }
    invokeResource(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._withSession(form, (session) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const objectId = yield this._resolveNodeId(form);
                const methodId = yield this._resolveMethodNodeId(form);
                const argumentDefinition = yield session.getArgumentDefinition(methodId);
                const inputArguments = yield this._resolveInputArguments(session, form, content, argumentDefinition);
                const callResult = yield session.call({
                    objectId,
                    methodId,
                    inputArguments,
                });
                if (callResult.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                    throw new Error("Error in Calling OPCUA Method : " + callResult.statusCode.toString());
                }
                const output = yield this._resolveOutputArguments(session, form, argumentDefinition, (_a = callResult.outputArguments) !== null && _a !== void 0 ? _a : []);
                return output;
            }));
        });
    }
    subscribeResource(form, next, error, complete) {
        debug(`subscribeResource: form ${form["opcua:nodeId"]}`);
        return this._withSubscription(form, (session, subscription) => __awaiter(this, void 0, void 0, function* () {
            const nodeId = yield this._resolveNodeId(form);
            const key = nodeId.toString();
            if (this._monitoredItems.has(key)) {
                const m = this._monitoredItems.get(key);
                m === null || m === void 0 ? void 0 : m.handlers.push(next);
                if (complete) {
                    complete();
                    complete = undefined;
                }
                return new Subscription_1.Subscription(() => __awaiter(this, void 0, void 0, function* () {
                    yield this._unmonitor(nodeId);
                }));
            }
            const itemToMonitor = {
                nodeId,
                attributeId: node_opcua_data_model_1.AttributeIds.Value,
            };
            const parameters = {
                samplingInterval: 250,
                discardOldest: true,
                queueSize: 1,
            };
            const monitoredItem = yield subscription.monitor(itemToMonitor, parameters, node_opcua_client_1.TimestampsToReturn.Both, node_opcua_client_1.MonitoringMode.Reporting);
            const m = {
                monitoredItem,
                handlers: [next],
            };
            this._monitoredItems.set(key, m);
            monitoredItem.on("changed", (dataValue) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const content = yield this._dataValueToContent(form, dataValue);
                    m.handlers.forEach((n) => n(content));
                }
                catch (err) {
                    debug(`${nodeId}: ${dataValue}`);
                    if (error) {
                        error(new Error(JSON.stringify(err)));
                    }
                }
                if (complete) {
                    complete();
                    complete = undefined;
                }
            }));
            monitoredItem.once("err", (err) => {
                error && error(err);
            });
            return new Subscription_1.Subscription(() => __awaiter(this, void 0, void 0, function* () {
                yield this._unmonitor(nodeId);
            }));
        }));
    }
    _unmonitor(nodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = nodeId.toString();
            if (this._monitoredItems.has(key)) {
                const m = this._monitoredItems.get(key);
                this._monitoredItems.delete(key);
                yield (m === null || m === void 0 ? void 0 : m.monitoredItem.terminate());
            }
        });
    }
    unlinkResource(form) {
        return __awaiter(this, void 0, void 0, function* () {
            debug(`unlinkResource: form ${form["opcua:nodeId"]}`);
            this._withSubscription(form, (session, subscription) => __awaiter(this, void 0, void 0, function* () {
                const nodeId = yield this._resolveNodeId(form);
                yield this._unmonitor(nodeId);
            }));
        });
    }
    requestThingDescription(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented");
        });
    }
    start() {
        debug("start: Sorry not implemented");
        throw new Error("Method not implemented.");
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            debug("stop");
            for (const c of this._connections.values()) {
                yield c.subscription.terminate();
                yield c.session.close();
                yield c.client.disconnect();
            }
        });
    }
    setSecurity(metadata, credentials) {
        return true;
    }
    _dataValueToContent(form, dataValue) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const contentType = (_a = form.contentType) !== null && _a !== void 0 ? _a : "application/json";
            const contentSerDes = core_1.ContentSerdes.get();
            if (contentType === "application/json") {
                const variantInJson = (0, node_opcua_json_1.opcuaJsonEncodeVariant)(dataValue.value, false);
                const content = contentSerDes.valueToContent(variantInJson, codec_1.schemaDataValue, contentType);
                return content;
            }
            const content = contentSerDes.valueToContent(dataValue, codec_1.schemaDataValue, contentType);
            return content;
        });
    }
    _contentToDataValue(form, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const content2 = Object.assign(Object.assign({}, content), { body: yield content.toBuffer() });
            const contentSerDes = core_1.ContentSerdes.get();
            const contentType = content2.type ? content2.type.split(";")[0] : "application/json";
            switch (contentType) {
                case "application/json": {
                    const dataType = yield this._predictDataType(form);
                    const value = contentSerDes.contentToValue(content2, codec_1.schemaDataValue);
                    return new node_opcua_client_1.DataValue({ value: { dataType, value } });
                }
                case "application/opcua+json": {
                    const fullContentType = content2.type + ";to=DataValue";
                    const content3 = {
                        type: fullContentType,
                        body: content2.body,
                    };
                    const dataValue = contentSerDes.contentToValue(content3, codec_1.schemaDataValue);
                    if (!(dataValue instanceof node_opcua_client_1.DataValue)) {
                        contentSerDes.contentToValue(content2, codec_1.schemaDataValue);
                        throw new Error("Internal Error, expecting a DataValue here ");
                    }
                    debug(`_contentToDataValue: write ${form}`);
                    debug(`_contentToDataValue: content ${Object.assign(Object.assign({}, content2), { body: content2.body.toString("ascii") })}`);
                    return dataValue;
                }
                default: {
                    throw new Error("Unsupported content type here : " + contentType);
                }
            }
        });
    }
    _contentToVariant(contentType, body, dataType) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const contentSerDes = core_1.ContentSerdes.get();
            contentType = (_a = contentType === null || contentType === void 0 ? void 0 : contentType.split(";")[0]) !== null && _a !== void 0 ? _a : "application/json";
            switch (contentType) {
                case "application/json": {
                    const value = contentSerDes.contentToValue({ type: contentType, body }, codec_1.schemaDataValue);
                    return new node_opcua_client_1.Variant({ dataType, value });
                }
                case "application/opcua+json": {
                    contentType += ";type=Variant;to=DataValue";
                    const content2 = { type: contentType, body };
                    const dataValue = contentSerDes.contentToValue(content2, codec_1.schemaDataValue);
                    if (!(dataValue instanceof node_opcua_client_1.DataValue)) {
                        throw new Error("Internal Error, expecting a DataValue here ");
                    }
                    const variant = dataValue.value;
                    if (variant.dataType !== dataType) {
                        debug(`Unexpected dataType ${variant.dataType}`);
                    }
                    return variant;
                }
                default: {
                    throw new Error("Unsupported content type here : " + contentType);
                }
            }
        });
    }
    _findBasicDataType(session, dataType) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield findBasicDataType(session, dataType);
        });
    }
    _resolveInputArguments(session, form, content, argumentDefinition) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if ((content === null || content === void 0 ? void 0 : content.body) == null) {
                return [];
            }
            const content2 = Object.assign(Object.assign({}, content), { body: yield content.toBuffer() });
            const bodyInput = JSON.parse(content2.body.toString());
            const inputArguments = ((_a = argumentDefinition.inputArguments) !== null && _a !== void 0 ? _a : []);
            const variants = [];
            for (let index = 0; index < inputArguments.length; index++) {
                const argument = inputArguments[index];
                const { name, dataType, arrayDimensions, valueRank } = argument;
                if (bodyInput[name !== null && name !== void 0 ? name : "null"] === undefined) {
                    throw new Error("missing value in bodyInput for argument " + name);
                }
                const basicDataType = yield this._findBasicDataType(session, dataType);
                if (basicDataType === undefined) {
                    throw new Error("basicDataType is undefined for dataType " + dataType);
                }
                const arrayType = valueRank === -1
                    ? node_opcua_client_1.VariantArrayType.Scalar
                    : valueRank === 1
                        ? node_opcua_client_1.VariantArrayType.Array
                        : node_opcua_client_1.VariantArrayType.Matrix;
                const n = (a) => Buffer.from(JSON.stringify(a));
                const v = yield this._contentToVariant(content2.type, n(bodyInput[name !== null && name !== void 0 ? name : "null"]), basicDataType);
                variants.push({
                    dataType: basicDataType,
                    arrayType,
                    dimensions: arrayType === node_opcua_client_1.VariantArrayType.Matrix ? arrayDimensions : undefined,
                    value: v.value,
                });
            }
            return variants;
        });
    }
    _resolveOutputArguments(session, form, argumentDefinition, outputVariants) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const outputArguments = ((_a = argumentDefinition.outputArguments) !== null && _a !== void 0 ? _a : []);
            const contentType = (_b = form.contentType) !== null && _b !== void 0 ? _b : "application/json";
            const body = {};
            for (let index = 0; index < outputArguments.length; index++) {
                const argument = outputArguments[index];
                const { name } = argument;
                const element = _variantToJSON(outputVariants[index], contentType);
                body[name !== null && name !== void 0 ? name : "null"] = element;
            }
            return new core_1.Content("application/json", stream_1.Readable.from(JSON.stringify(body)));
        });
    }
}
exports.OPCUAProtocolClient = OPCUAProtocolClient;
//# sourceMappingURL=opcua-protocol-client.js.map