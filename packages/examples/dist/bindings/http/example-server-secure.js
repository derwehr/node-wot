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
const binding_http_1 = require("@node-wot/binding-http");
// create secure Servient with username & password credentials
const servient = new core_1.Servient();
servient.addCredentials({
    "urn:dev:wot:org:eclipse:thingweb:my-example-secure": {
        username: "node-wot",
        password: "hello",
        // token: "1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM"
    },
});
const httpConfig = {
    allowSelfSigned: true,
    serverKey: "privatekey.pem",
    serverCert: "certificate.pem",
    security: [
        {
            scheme: "basic", // (username & password)
        },
    ],
};
// add HTTPS binding with configuration
servient.addServer(new binding_http_1.HttpServer(httpConfig));
servient.start().then((WoT) => {
    WoT.produce({
        title: "MyCounter",
        properties: {
            count: {
                type: "integer",
            },
        },
    }).then((thing) => {
        // init property value
        let count = 0;
        console.log("Produced " + thing.getThingDescription().title);
        // set property handlers (using async-await)
        thing.setPropertyReadHandler("count", async () => count);
        thing.setPropertyWriteHandler("count", async (intOutput) => {
            const value = await intOutput.value();
            if (typeof value === "number") {
                count = value;
            }
        });
        thing.expose().then(() => {
            console.info(thing.getThingDescription().title + " ready");
            console.info("TD : " + JSON.stringify(thing.getThingDescription()));
        });
    });
});
