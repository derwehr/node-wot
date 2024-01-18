"use strict";
/********************************************************************************
 * Copyright (c) 2022 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * Document License (2015-05-13) which is available at
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const binding_opcua_1 = require("@node-wot/binding-opcua");
const demo_opcua_thing_description_1 = require("./demo-opcua-thing-description");
(async () => {
    const servient = new core_1.Servient();
    servient.addClientFactory(new binding_opcua_1.OPCUAClientFactory());
    const wot = await servient.start();
    const thing = await wot.consume(demo_opcua_thing_description_1.thingDescription);
    const content = await thing.readProperty("pumpSpeed");
    const pumpSpeed = await content.value();
    console.log("------------------------------");
    console.log("Pump Speed is : ", pumpSpeed, "m/s");
    console.log("------------------------------");
    await servient.shutdown();
})();
