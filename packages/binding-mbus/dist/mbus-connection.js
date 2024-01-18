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
exports.PropertyOperation = exports.MBusConnection = void 0;
const core_1 = require("@node-wot/core");
const stream_1 = require("stream");
const MbusMaster = require("node-mbus");
const { debug, warn, error } = (0, core_1.createLoggers)("binding-mbus", "mbus-connection");
const configDefaults = {
    operationTimeout: 10000,
    connectionRetryTime: 10000,
    maxRetries: 5,
};
class MBusTransaction {
    constructor(unitId, base) {
        this.unitId = unitId;
        this.base = base;
        this.operations = new Array();
    }
    inform(op) {
        this.operations.push(op);
    }
}
class MBusConnection {
    constructor(host, port, config = configDefaults) {
        this.host = host;
        this.port = port;
        this.client = new MbusMaster({
            host: this.host,
            port: this.port,
            timeout: config.connectionTimeout,
            autoConnect: false,
        });
        this.connecting = false;
        this.connected = false;
        this.timer = undefined;
        this.currentTransaction = undefined;
        this.queue = new Array();
        this.config = Object.assign(configDefaults, config);
    }
    enqueue(op) {
        for (const t of this.queue) {
            if (op.unitId === t.unitId) {
                t.inform(op);
                return;
            }
        }
        const transaction = new MBusTransaction(op.unitId, op.base);
        transaction.inform(op);
        this.queue.push(transaction);
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connecting && !this.connected) {
                debug(`Trying to connect to ${this.host}`);
                this.connecting = true;
                for (let retry = 0; retry < this.config.maxRetries; retry++) {
                    const success = this.client.connect((err) => {
                        if (err != null) {
                            warn(`Cannot connect to ${this.host}. Reason: ${err}. Retry in ${this.config.connectionRetryTime}ms.`);
                        }
                    });
                    if (success) {
                        this.connecting = false;
                        this.connected = true;
                        debug(`MBus connected to ${this.host}`);
                        return;
                    }
                    else {
                        this.connecting = false;
                        if (retry >= this.config.maxRetries - 1) {
                            throw new Error("Max connection retries");
                        }
                        yield new Promise((resolve, reject) => setTimeout(resolve, this.config.connectionRetryTime));
                    }
                }
            }
        });
    }
    execute(op) {
        return __awaiter(this, void 0, void 0, function* () {
            this.trigger();
            return op.execute();
        });
    }
    trigger() {
        return __awaiter(this, void 0, void 0, function* () {
            debug("MBusConnection:trigger");
            if (!this.connecting && !this.connected) {
                try {
                    yield this.connect();
                    this.trigger();
                }
                catch (error) {
                    warn("Cannot reconnect to m-bus server");
                    this.queue.forEach((transaction) => {
                        transaction.operations.forEach((op) => {
                            op.failed(error instanceof Error ? error : new Error(JSON.stringify(error)));
                        });
                    });
                }
            }
            else if (this.connected && this.currentTransaction == null && this.queue.length > 0) {
                this.currentTransaction = this.queue.shift();
                if (!this.currentTransaction) {
                    warn(`Current transaction is undefined -> transaction not executed`);
                    return;
                }
                try {
                    yield this.executeTransaction(this.currentTransaction);
                    this.currentTransaction = undefined;
                    this.trigger();
                }
                catch (err) {
                    warn(`Transaction failed: ${err}`);
                    this.currentTransaction = undefined;
                    this.trigger();
                }
            }
        });
    }
    executeTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("Execute read operation on unit", transaction.unitId);
            try {
                const result = yield this.readMBus(transaction);
                debug(`Got result from read operation on unit ${transaction.unitId}"`);
                transaction.operations.forEach((op) => op.done(op.base, result));
            }
            catch (err) {
                warn(`Read operation failed on unit ${transaction.unitId}. ${err}.`);
                transaction.operations.forEach((op) => op.failed(error instanceof Error ? error : new Error(JSON.stringify(error))));
                throw err;
            }
        });
    }
    close() {
        this.mbusstop();
    }
    readMBus(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                debug("Invoking read transaction");
                if (this.timer) {
                    clearTimeout(this.timer);
                }
                this.timer = global.setTimeout(() => this.mbusstop(), this.config.operationTimeout);
                this.client.getData(transaction.unitId, (error, data) => {
                    if (error !== null)
                        reject(error);
                    resolve(data);
                });
            });
        });
    }
    mbusstop() {
        debug("Closing unused connection");
        this.client.close((err) => {
            if (err === null) {
                debug("session closed");
                this.connecting = false;
                this.connected = false;
            }
            else {
                error(`Cannot close session. ${err}`);
            }
        });
        clearInterval(this.timer);
        this.timer = undefined;
    }
}
exports.MBusConnection = MBusConnection;
class PropertyOperation {
    constructor(form) {
        this.unitId = form["mbus:unitID"];
        if (form["mbus:offset"] === undefined) {
            throw new Error("form['mbus:offset'] is undefined");
        }
        this.base = form["mbus:offset"];
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        });
    }
    done(base, result) {
        debug("Operation done");
        let payload = "";
        if (base === -1) {
            payload = result.SlaveInformation;
        }
        else {
            result.DataRecord.forEach((dataRec) => {
                if (base === dataRec.id) {
                    payload = dataRec;
                }
            });
        }
        const resp = new core_1.Content("application/json", stream_1.Readable.from(JSON.stringify(payload)));
        if (!this.resolve) {
            throw new Error("Function 'done' was invoked before executing the Mbus operation");
        }
        this.resolve(resp);
    }
    failed(reason) {
        warn(`Operation failed: ${reason}`);
        if (!this.reject) {
            throw new Error("Function 'failed' was invoked before executing the Mbus operation");
        }
        this.reject(reason);
    }
}
exports.PropertyOperation = PropertyOperation;
//# sourceMappingURL=mbus-connection.js.map