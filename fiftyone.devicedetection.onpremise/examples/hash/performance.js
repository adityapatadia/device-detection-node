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

/**
@example hash/performance.js

@include{doc} example-performance-hash.txt

This example is available in full on [GitHub](https://github.com/51Degrees/device-detection-node/blob/master/fiftyone.devicedetection/examples/hash/performance.js).

@include{doc} example-require-datafile.txt

This example require module 'n-readlines' to operate. Please install the module
before running the example, by using the following command:

```
npm install n-readlines
```

Expected output:

```
Processing [...] User-Agents from [...]/20000 User Agents.csv
Calibrating
Processing
Average [...] detections per second.
Average [...] ms per User-Agent.
ismobile = true : [...]
ismobile = false : [...]
ismobile = unknown : [...]

```

 */

const events = require('events');

const lineReader = require('n-readlines');

const DeviceDetectionOnPremisePipelineBuilder =
  require((process.env.directory || __dirname) +
  '/../../deviceDetectionOnPremisePipelineBuilder');

// Load in a datafile
const datafile = (process.env.directory || __dirname) +
  '/../../device-detection-cxx/device-detection-data/51Degrees-LiteV4.1.hash';

// Load in a user-agents file
const uafile = (process.env.directory || __dirname) +
  '/../../device-detection-cxx/device-detection-data/20000 User Agents.csv';

// Check if files exists
const fs = require('fs');
if (!fs.existsSync(datafile)) {
  console.error('The datafile required by this example is not present. ' +
    'Please ensure that the \'device-detection-data\' submodule has been ' +
    'fetched.');
  throw ("No data file at '" + datafile + "'");
}

if (!fs.existsSync(uafile)) {
  console.error('The User-Agents file required by this example is not ' +
    'present. Please ensure that the \'device-detection-data\' submodule ' +
    'has been fetched.');
  throw ("No User-Agents file at '" + datafile + "'");
}

const secToNanoSec = 1e9;
const msecToNanoSec = 1e6;

let userAgentsProcessed = 0;
let isMobileTrue = 0;
let isMobileFalse = 0;
let isMobileUnknown = 0;
let userAgentsCount = 0;
let startTime, diffTime, calibrationTime, actualTime;

// Create an event listener for when User-Agents
// have been processed.
// This event listener is used in two stages.
// The first stage is when the calibration has finished
// and the actual processing will be kicked off.
// The second stage is when the actual processing has
// finished and the final report is displayed.
const eventEmitter = new events.EventEmitter();
eventEmitter.on('FinishProcessing', (calibration) => {
  diffTime = process.hrtime(startTime);

  if (calibration) {
    // Record the calibration time
    calibrationTime = diffTime[0] * secToNanoSec + diffTime[1];
    
    // Run without calibration
    console.log('Processing');
    run(function (userAgent) {
      processUA(userAgent, false);
    })
  } else {
    // Record the actual time
    actualTime = diffTime[0] * secToNanoSec + diffTime[1];

    // Display benchmarks
    console.log(
      `Average ` +
      `${(userAgentsCount / (actualTime - calibrationTime)) * secToNanoSec} ` +
      `detections per second per thread.`);
    console.log(
      `Average ` +
      `${((actualTime - calibrationTime) / msecToNanoSec) / userAgentsCount} ` +
      `ms per User-Agent.`);
    console.log(`ismobile = true : ${isMobileTrue}`);
    console.log(`ismobile = false : ${isMobileFalse}`);
    console.log(`ismobile = unknown : ${isMobileUnknown}`);
  }  
});

// Create the device detection pipeline with the desired settings.
const pipeline = new DeviceDetectionOnPremisePipelineBuilder({
    performanceProfile: 'MaxPerformance',
    dataFile: datafile,
    restrictedProperties: [ 'ismobile' ],
    autoUpdate: false,
    shareUsage: false,
    usePredictiveGraph: false,
    usePerformanceGraph: true,
    addJavaScriptBuilder: false
  }).build();

// To monitor the pipeline we can put in listeners for various log events.
// Valid types are info, debug, warn, error
pipeline.on('error', console.error);

// Print out the progress report
const progressBar = '========================================';
const reportProgress = function (uaProcessed) {
  let bars = Math.round((uaProcessed / userAgentsCount) * progressBar.length);
  process.stdout.write(progressBar.substring(0, bars) +
    (uaProcessed === userAgentsCount ? '\n' : '\r'));
}

// Here we make a function that gets a userAgent as evidence and
// uses the Device Detection Engine to obtain the properties of the
// device and output it to file.
const processUA = async function (userAgent, calibration) {
  if (calibration) {
    isMobileFalse++;
  } else {
    // Create a FlowData element
    // This is used to add evidence and process it through the
    // FlowElements in the Pipeline.
    const flowData = pipeline.createFlowData();
  
    // Add the User-Agent as evidence
    flowData.evidence.add('header.user-agent', userAgent);
  
    // Run process on the flowData (this returns a promise)
    await flowData.process();
  
    // Construct the output line
    const ismobile = flowData.device.ismobile;
  
    if (ismobile.hasValue) {
      if (ismobile.value) {
        isMobileTrue++;
      } else {
        isMobileFalse++;
      }
    } else {
      isMobileUnknown++;
    }
  }

  // Increment the number of User-Agent processed and
  // signal if the required number has been reached
  reportProgress(++userAgentsProcessed);
  if (userAgentsProcessed === userAgentsCount) {
    eventEmitter.emit('FinishProcessing', calibration);
  }
};

// Loop through the User-Agents in the file
// and execute callback on each User-Agent
const run = function (callback) {
  const liner = new lineReader(uafile);
  let line;
  
  // Reset User-Agents processed count and start time
  userAgentsProcessed = 0;
  startTime = process.hrtime();
  while(line = liner.next()) {
      callback(line.toString('utf8').replace(/\r?\n|\r/g, ""));
  }
}

// Get the number of User-Agents
run(function () {
  userAgentsCount++;
})
console.log('Processing ' + userAgentsCount + ' User-Agents from ' + uafile);

// Run with calibration
console.log('Calibrating');
run(function (userAgent) {
  processUA(userAgent, true);
})
