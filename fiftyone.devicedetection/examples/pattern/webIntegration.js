/* *********************************************************************
 * This Original Work is copyright of 51 Degrees Mobile Experts Limited.
 * Copyright 2019 51 Degrees Mobile Experts Limited, 5 Charlotte Close,
 * Caversham, Reading, Berkshire, United Kingdom RG4 7BY.
 *
 * This Original Work is licensed under the European Union Public Licence (EUPL) 
 * v.1.2 and is subject to its terms as set out below.
 *
 * If a copy of the EUPL was not distributed with this file, You can obtain
 * one at https://opensource.org/licenses/EUPL-1.2.
 *
 * The 'Compatible Licences' set out in the Appendix to the EUPL (as may be
 * amended by the European Commission) shall be deemed incompatible for
 * the purposes of the Work and the provisions of the compatibility
 * clause in Article 5 of the EUPL shall not apply.
 * 
 * If using the Work as, or as part of, a network application, by 
 * including the attribution notice(s) required under Article 5 of the EUPL
 * in the end user terms of the application under an appropriate heading, 
 * such notice(s) shall fulfill the requirements of that article.
 * ********************************************************************* */

/*
@example pattern/webIntegration.js

This example demonstrates the evidence.addFromRequest() method and client side JavaScript overrides by creating a web server, serving JavaScript created by the device detection engine and bundled together by a special JavaScript bundler engine.. This JavaScript is then used on the client side to save a cookie so that when the device detection engine next processes the request (using the addFromRequest() method) it has a more accurate reading for properties set on the clientside.

*/

const FiftyOneDegreesDeviceDetection = require((process.env.directory || __dirname) + "/../../");

const fs = require("fs");

// Load in a datafile

let datafile = (process.env.directory || __dirname) + "/../../device-detection-cxx/device-detection-data/51Degrees-LiteV3.2.dat";

if (!fs.existsSync(datafile)) {
    console.error("The datafile required by this example is not present. Please ensure that the 'device-detection-data' submodule has been fetched.");
    throw ("No data file at '" + datafile + "'");
}

// Create a new Device Detection pipeline and set the config.
let pipeline = new FiftyOneDegreesDeviceDetection.deviceDetectionPipelineBuilder({
    performanceProfile: "MaxPerformance",
    dataFile: datafile,
    autoUpdate: false,
}).build();

// Logging of errors and other messages. Valid logs types are info, debug, warn, error
pipeline.on("error", console.error);

const http = require('http');

const server = http.createServer((req, res) => {

    let flowData = pipeline.createFlowData();

    // Add any information from the request (headers, cookies and additional client side provided information)
    flowData.evidence.addFromRequest(req);

    flowData.process().then(function () {

        // A property like screenpixelswidth needs to be measured on the clientside for full accuracy

        if (flowData.device.screenpixelswidth.hasValue) {

            console.log(`screenpixelwidth = ${flowData.device.screenpixelswidth.value}`);

        }

        // Get JavaScript to put inside the page so that the second request gets extra information in cookies

        let js = `<script>${flowData.javascript.javascript}</script>`;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(js);

    });

});

const port = 3002;
server.listen(port);
console.log("Server listening on port: " + port); 
