"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModbusForm = exports.ModbusFunction = exports.ModbusClient = exports.ModbusClientFactory = void 0;
const td_tools_1 = require("@node-wot/td-tools");
var modbus_client_factory_1 = require("./modbus-client-factory");
Object.defineProperty(exports, "ModbusClientFactory", { enumerable: true, get: function () { return __importDefault(modbus_client_factory_1).default; } });
var modbus_client_1 = require("./modbus-client");
Object.defineProperty(exports, "ModbusClient", { enumerable: true, get: function () { return __importDefault(modbus_client_1).default; } });
__exportStar(require("./modbus-client"), exports);
__exportStar(require("./modbus-client-factory"), exports);
var ModbusFunction;
(function (ModbusFunction) {
    ModbusFunction[ModbusFunction["readCoil"] = 1] = "readCoil";
    ModbusFunction[ModbusFunction["readDiscreteInput"] = 2] = "readDiscreteInput";
    ModbusFunction[ModbusFunction["readHoldingRegisters"] = 3] = "readHoldingRegisters";
    ModbusFunction[ModbusFunction["readInputRegister"] = 4] = "readInputRegister";
    ModbusFunction[ModbusFunction["writeSingleCoil"] = 5] = "writeSingleCoil";
    ModbusFunction[ModbusFunction["writeSingleHoldingRegister"] = 6] = "writeSingleHoldingRegister";
    ModbusFunction[ModbusFunction["writeMultipleCoils"] = 15] = "writeMultipleCoils";
    ModbusFunction[ModbusFunction["writeMultipleHoldingRegisters"] = 16] = "writeMultipleHoldingRegisters";
})(ModbusFunction = exports.ModbusFunction || (exports.ModbusFunction = {}));
class ModbusForm extends td_tools_1.Form {
}
exports.ModbusForm = ModbusForm;
//# sourceMappingURL=modbus.js.map