"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const core_1 = require("@node-wot/core");
const binding_opcua_1 = require("@node-wot/binding-opcua");
const opcua_coffee_machine_thing_description_1 = require("./opcua-coffee-machine-thing-description");
const pause = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
    const servient = new core_1.Servient();
    servient.addClientFactory(new binding_opcua_1.OPCUAClientFactory());
    const wot = await servient.start();
    const thing = await wot.consume(opcua_coffee_machine_thing_description_1.thingDescription);
    try {
        thing.observeProperty("waterTankLevel", async (data) => {
            const waterTankLevel = await data.value();
            console.log("------------------------------");
            console.log("tankLevel : ", waterTankLevel, "ml");
            console.log("------------------------------");
        });
        thing.observeProperty("coffeeBeanLevel", async (data) => {
            const coffeBeanLevel = await data.value();
            console.log("------------------------------");
            console.log("bean level : ", coffeBeanLevel, "g");
            console.log("------------------------------");
        });
        await thing.invokeAction("brewCoffee", { CoffeeType: 1 });
        await pause(5000);
        await thing.invokeAction("brewCoffee", { CoffeeType: 0 });
        await pause(5000);
        await thing.invokeAction("fillTank");
        await pause(5000);
    }
    finally {
        await servient.shutdown();
    }
})();
