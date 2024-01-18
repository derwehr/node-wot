"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPropertyOpValues = exports.filterEventOperations = exports.filterPropertyReadWriteOperations = exports.filterPropertyObserveOperations = void 0;
const core_1 = require("@node-wot/core");
const observeOpFilter = ["observeproperty", "unobserveproperty"];
const readWriteOpFilter = ["readproperty", "writeproperty"];
const eventOpFilter = ["subscribeevent", "unsubscribeevent"];
function filterOpValues(opValues, filterValues) {
    return opValues.filter((opValue) => filterValues.includes(opValue));
}
function filterPropertyObserveOperations(opValues) {
    return filterOpValues(opValues, observeOpFilter);
}
exports.filterPropertyObserveOperations = filterPropertyObserveOperations;
function filterPropertyReadWriteOperations(opValues) {
    return filterOpValues(opValues, readWriteOpFilter);
}
exports.filterPropertyReadWriteOperations = filterPropertyReadWriteOperations;
function filterEventOperations(opValues) {
    return filterOpValues(opValues, eventOpFilter);
}
exports.filterEventOperations = filterEventOperations;
function getPropertyOpValues(property) {
    const opValues = core_1.ProtocolHelpers.getPropertyOpValues(property);
    const readWriteOpValues = filterPropertyReadWriteOperations(opValues);
    const observeOpValues = filterPropertyObserveOperations(opValues);
    return [readWriteOpValues, observeOpValues];
}
exports.getPropertyOpValues = getPropertyOpValues;
//# sourceMappingURL=util.js.map