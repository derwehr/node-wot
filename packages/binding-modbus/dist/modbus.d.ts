import { Form } from "@node-wot/td-tools";
export { default as ModbusClientFactory } from "./modbus-client-factory";
export { default as ModbusClient } from "./modbus-client";
export * from "./modbus-client";
export * from "./modbus-client-factory";
export declare type ModbusEntity = "Coil" | "InputRegister" | "HoldingRegister" | "DiscreteInput";
export declare enum ModbusFunction {
    "readCoil" = 1,
    "readDiscreteInput" = 2,
    "readHoldingRegisters" = 3,
    "readInputRegister" = 4,
    "writeSingleCoil" = 5,
    "writeSingleHoldingRegister" = 6,
    "writeMultipleCoils" = 15,
    "writeMultipleHoldingRegisters" = 16
}
export declare type ModbusFunctionName = "readCoil" | "readDiscreteInput" | "readHoldingRegisters" | "writeSingleCoil" | "writeSingleHoldingRegister" | "writeMultipleCoils" | "writeMultipleHoldingRegisters";
export declare class ModbusForm extends Form {
    "modbus:function"?: ModbusFunction | ModbusFunctionName;
    "modbus:entity"?: ModbusEntity;
    "modbus:unitID"?: number;
    "modbus:address"?: number;
    "modbus:quantity"?: number;
    "modbus:timeout"?: number;
    "modbus:pollingTime"?: number;
}
