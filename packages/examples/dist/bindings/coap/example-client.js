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
const binding_coap_1 = require("@node-wot/binding-coap");
// create Servient and add CoAP binding
const servient = new core_1.Servient();
servient.addClientFactory(new binding_coap_1.CoapClientFactory());
servient
    .start()
    .then(async (WoT) => {
    try {
        const td = await WoT.requestThingDescription("coap://plugfest.thingweb.io:5683/testthing");
        const thing = await WoT.consume(td);
        // read property
        const read1 = await thing.readProperty("string");
        console.log("string value is: ", await read1.value());
    }
    catch (err) {
        console.error("Script error:", err);
    }
})
    .catch((err) => {
    console.error("Start error:", err);
});