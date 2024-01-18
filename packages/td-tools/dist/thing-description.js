"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThingEvent = exports.ThingAction = exports.ThingProperty = exports.BaseSchema = exports.Form = exports.DEFAULT_THING_TYPE = exports.DEFAULT_CONTEXT_LANGUAGE = exports.DEFAULT_CONTEXT_V11 = exports.DEFAULT_CONTEXT_V1 = void 0;
exports.DEFAULT_CONTEXT_V1 = "https://www.w3.org/2019/wot/td/v1";
exports.DEFAULT_CONTEXT_V11 = "https://www.w3.org/2022/wot/td/v1.1";
exports.DEFAULT_CONTEXT_LANGUAGE = "en";
exports.DEFAULT_THING_TYPE = "Thing";
class Thing {
    constructor() {
        this["@context"] = [exports.DEFAULT_CONTEXT_V1, exports.DEFAULT_CONTEXT_V11];
        this["@type"] = exports.DEFAULT_THING_TYPE;
        this.title = "";
        this.securityDefinitions = {};
        this.security = "";
        this.properties = {};
        this.actions = {};
        this.events = {};
        this.links = [];
    }
}
exports.default = Thing;
class Form {
    constructor(href, contentType) {
        this.href = href;
        if (contentType != null)
            this.contentType = contentType;
    }
}
exports.Form = Form;
class BaseSchema {
}
exports.BaseSchema = BaseSchema;
class ThingProperty extends BaseSchema {
}
exports.ThingProperty = ThingProperty;
class ThingAction {
}
exports.ThingAction = ThingAction;
class ThingEvent {
}
exports.ThingEvent = ThingEvent;
//# sourceMappingURL=thing-description.js.map