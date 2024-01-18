/********************************************************************************
 * Copyright (c) 2021 Contributors to the Eclipse Foundation
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
declare function uuidv4(): string;
declare enum Status {
    "pending" = 0,
    "running" = 1,
    "completed" = 2,
    "failed" = 3
}
interface ActionStatus {
    status: Status;
    output?: number;
    error?: Error;
    href?: string;
}
declare let countdowns: Map<string, ActionStatus>;
