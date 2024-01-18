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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyOperation = exports.ModbusConnection = void 0;
const modbus_serial_1 = __importDefault(require("modbus-serial"));
const core_1 = require("@node-wot/core");
const stream_1 = require("stream");
const util_1 = require("util");
const { debug, warn, error } = (0, core_1.createLoggers)("binding-modbus", "modbus-connection");
const configDefaults = {
    connectionTimeout: 1000,
    operationTimeout: 2000,
    connectionRetryTime: 10000,
    maxRetries: 5,
};
class ModbusTransaction {
    constructor(connection, unitId, registerType, func, base, quantity, endianness, content) {
        this.connection = connection;
        this.unitId = unitId;
        this.registerType = registerType;
        this.function = func;
        this.base = base;
        this.quantity = quantity;
        this.content = content;
        this.operations = new Array();
        this.endianness = endianness;
    }
    inform(op) {
        op.transaction = this;
        this.operations.push(op);
    }
    trigger() {
        debug("ModbusTransaction:trigger");
        this.connection.trigger();
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.content) {
                debug(`Trigger read operation on ${this.base}, len: ${this.quantity}`);
                try {
                    const result = yield this.connection.readModbus(this);
                    debug(`Got result from read operation on ${this.base}, len: ${this.quantity}`);
                    this.operations.forEach((op) => op.done(this.base, result.buffer));
                }
                catch (err) {
                    warn(`Read operation failed on ${this.base}, len: ${this.quantity}, ${err}`);
                    this.operations.forEach((op) => op.failed(err instanceof Error ? err : new Error(JSON.stringify(err))));
                    throw err;
                }
            }
            else {
                debug(`Trigger write operation on ${this.base}, len: ${this.quantity}`);
                try {
                    yield this.connection.writeModbus(this);
                    this.operations.forEach((op) => op.done());
                }
                catch (err) {
                    warn(`Write operation failed on ${this.base}, len: ${this.quantity}, ${err}`);
                    this.operations.forEach((op) => op.failed(err instanceof Error ? err : new Error(JSON.stringify(err))));
                    throw err;
                }
            }
        });
    }
}
class ModbusConnection {
    constructor(host, port, config = configDefaults) {
        this.host = host;
        this.port = port;
        this.client = new modbus_serial_1.default();
        this.connected = false;
        this.connecting = false;
        this.timer = null;
        this.currentTransaction = null;
        this.queue = new Array();
        this.config = Object.assign(configDefaults, config);
    }
    enqueue(op) {
        for (const t of this.queue) {
            if (op.unitId === t.unitId &&
                op.registerType === t.registerType &&
                (op.content != null) === (t.content != null)) {
                if (op.base === t.base + t.quantity) {
                    t.quantity += op.quantity;
                    if (t.content && op.content) {
                        t.content = Buffer.concat([t.content, op.content]);
                    }
                    t.inform(op);
                    return;
                }
                if (op.base + op.quantity === t.base) {
                    t.base -= op.quantity;
                    t.quantity += op.quantity;
                    if (t.content && op.content) {
                        t.content = Buffer.concat([op.content, t.content]);
                    }
                    t.inform(op);
                    return;
                }
            }
        }
        const transaction = new ModbusTransaction(this, op.unitId, op.registerType, op.function, op.base, op.quantity, op.endianness, op.content);
        transaction.inform(op);
        this.queue.push(transaction);
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connecting && !this.client.isOpen) {
                debug(`Trying to connect to ${this.host}`);
                this.connecting = true;
                for (let retry = 0; retry < this.config.maxRetries; retry++) {
                    try {
                        this.client.setTimeout(this.config.connectionTimeout);
                        yield this.client.connectTCP(this.host, { port: this.port });
                        this.connecting = false;
                        debug(`Modbus connected to ${this.host}`);
                        return;
                    }
                    catch (err) {
                        warn(`Cannot connect to ${this.host}. Reason: ${err}. Retry in ${this.config.connectionRetryTime}ms.`);
                        this.connecting = false;
                        if (retry >= this.config.maxRetries - 1) {
                            throw new Error("Max connection retries");
                        }
                        yield new Promise((resolve) => setTimeout(resolve, this.config.connectionRetryTime));
                    }
                }
            }
        });
    }
    trigger() {
        return __awaiter(this, void 0, void 0, function* () {
            warn("trigger");
            if (!this.connecting && !this.client.isOpen) {
                try {
                    yield this.connect();
                    this.trigger();
                }
                catch (error) {
                    warn("Cannot reconnect to modbus server");
                    while (this.queue.length > 0) {
                        const transaction = this.queue.shift();
                        transaction.operations.forEach((operation) => {
                            operation.failed(error instanceof Error ? error : new Error(JSON.stringify(error)));
                        });
                    }
                }
            }
            else if (this.client.isOpen && this.currentTransaction == null && this.queue.length > 0) {
                this.currentTransaction = this.queue.shift();
                try {
                    yield this.currentTransaction.execute();
                    this.currentTransaction = null;
                    this.trigger();
                }
                catch (err) {
                    warn(`Transaction failed. ${err}`);
                    this.currentTransaction = null;
                    this.trigger();
                }
            }
        });
    }
    close() {
        this.modbusstop();
    }
    readModbus(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("Invoking read transaction");
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = global.setTimeout(() => this.modbusstop(), this.config.operationTimeout);
            const regType = transaction.registerType;
            this.client.setID(transaction.unitId);
            switch (regType) {
                case "InputRegister":
                    return this.client.readInputRegisters(transaction.base, transaction.quantity);
                case "Coil":
                    return this.client.readCoils(transaction.base, transaction.quantity);
                case "HoldingRegister":
                    return this.client.readHoldingRegisters(transaction.base, transaction.quantity);
                case "DiscreteInput":
                    return this.client.readDiscreteInputs(transaction.base, transaction.quantity);
                default:
                    throw new Error("cannot read unknown register type " + regType);
            }
        });
    }
    writeModbus(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("Invoking write transaction");
            if (this.timer) {
                clearTimeout(this.timer);
            }
            if (!transaction.content) {
                throw new Error("Invoked write transaction without content");
            }
            this.timer = global.setTimeout(() => this.modbusstop(), this.config.operationTimeout);
            const modFunc = transaction.function;
            this.client.setID(transaction.unitId);
            switch (modFunc) {
                case 5: {
                    const coil = transaction.content.readUInt8(0) !== 0;
                    const result = yield this.client.writeCoil(transaction.base, coil);
                    if (result.address !== transaction.base && result.state !== coil) {
                        throw new Error(`writing ${coil} to ${transaction.base} failed, state is ${result.state}`);
                    }
                    break;
                }
                case 15: {
                    const coils = new Array();
                    transaction.content.forEach((v) => coils.push(v !== 0));
                    const coilsResult = yield this.client.writeCoils(transaction.base, coils);
                    if (coilsResult.address !== transaction.base && coilsResult.length !== transaction.quantity) {
                        throw new Error(`writing ${coils} to ${transaction.base} failed`);
                    }
                    break;
                }
                case 6: {
                    if (transaction.endianness !== core_1.Endianness.BIG_ENDIAN) {
                        transaction.content.swap16();
                    }
                    const value = transaction.content.readUInt16BE(0);
                    const resultRegister = yield this.client.writeRegister(transaction.base, value);
                    if (resultRegister.address !== transaction.base && resultRegister.value !== value) {
                        throw new Error(`writing ${value} to ${transaction.base} failed, state is ${resultRegister.value}`);
                    }
                    break;
                }
                case 16: {
                    const registers = yield this.client.writeRegisters(transaction.base, transaction.content);
                    if (registers.address === transaction.base && transaction.quantity / 2 > registers.length) {
                        warn(`short write to registers ${transaction.base} + ${transaction.quantity}, wrote ${(0, util_1.inspect)(transaction.content)} to ${registers.address} + ${registers.length} `);
                    }
                    else if (registers.address !== transaction.base) {
                        throw new Error(`writing ${(0, util_1.inspect)(transaction.content)} to registers ${transaction.base} + ${transaction.quantity} failed, wrote to ${registers.address}`);
                    }
                    break;
                }
                default:
                    throw new Error("cannot read unknown function type " + modFunc);
            }
        });
    }
    modbusstop() {
        debug("Closing unused connection");
        this.client.close((err) => {
            if (!err) {
                debug("Session closed");
                this.connecting = false;
            }
            else {
                error(`Cannot close session. ${err}`);
            }
        });
        this.timer && clearInterval(this.timer);
        this.timer = null;
    }
}
exports.ModbusConnection = ModbusConnection;
class PropertyOperation {
    constructor(form, endianness, content) {
        var _a;
        this.unitId = form["modbus:unitID"];
        this.registerType = form["modbus:entity"];
        this.base = form["modbus:address"];
        this.quantity = form["modbus:quantity"];
        this.function = form["modbus:function"];
        this.endianness = endianness;
        this.contentType = (_a = form.contentType) !== null && _a !== void 0 ? _a : core_1.ContentSerdes.DEFAULT;
        this.content = content;
        this.transaction = null;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
                if (this.transaction == null) {
                    reject(Error("No transaction for this operation"));
                }
                else {
                    this.transaction.trigger();
                }
            });
        });
    }
    done(base, buffer) {
        debug("Operation done");
        if (!this.resolve || !this.reject) {
            throw new Error("Function 'done' was invoked before executing the Modbus operation");
        }
        if (base === null || base === undefined) {
            this.resolve();
            return;
        }
        if (buffer === null || buffer === undefined) {
            this.reject(new Error("Write operation finished without buffer"));
            return;
        }
        const address = this.base - base;
        let resp;
        if (this.registerType === "InputRegister" || this.registerType === "HoldingRegister") {
            const bufstart = 2 * address;
            const bufend = 2 * (address + this.quantity);
            resp = new core_1.Content(this.contentType, stream_1.Readable.from(buffer.slice(bufstart, bufend)));
        }
        else {
            resp = new core_1.Content(this.contentType, stream_1.Readable.from(buffer.slice(address, this.quantity)));
        }
        this.resolve(resp);
    }
    failed(reason) {
        warn(`Operation failed: ${reason}`);
        if (!this.reject) {
            throw new Error("Function 'failed' was invoked before executing the Modbus operation");
        }
        this.reject(reason);
    }
}
exports.PropertyOperation = PropertyOperation;
//# sourceMappingURL=modbus-connection.js.map