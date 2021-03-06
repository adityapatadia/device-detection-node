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
@example hash/matchMetrics.js

@include{doc} example-match-metrics-hash.txt

This example is available in full on [GitHub](https://github.com/51Degrees/device-detection-node/blob/master/fiftyone.devicedetection/examples/hash/matchMetrics.js).

@include{doc} example-require-datafile.txt

Expected output:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36
Matched User-Agent: __zilla/5.0 (Windows____10.0; Win6_______________________________________________Chrome/7_.0.3904__7 Safari/5_____
Matched Nodes: 23
Id: 15364-38914-97847-0
Difference: 0
Drift: 0
Iterations: 55
Method: 3
ismobile: false
screenpixelswidth: 0
...
```

 */

const DeviceDetectionOnPremisePipelineBuilder =
  require((process.env.directory || __dirname) +
    '/../../deviceDetectionOnPremisePipelineBuilder');

// Load in a datafile

const datafile = (process.env.directory || __dirname) +
  '/../../device-detection-cxx/device-detection-data/51Degrees-LiteV4.1.hash';

// Check if datafile exists

const fs = require('fs');
if (!fs.existsSync(datafile)) {
  console.error('The datafile required by this example is not present. ' +
    'Please ensure that the \'device-detection-data\' submodule has been ' +
    'fetched.');
  throw ("No data file at '" + datafile + "'");
}

// Create the device detection pipeline with the desired settings.

const pipeline =
  new DeviceDetectionOnPremisePipelineBuilder({
  dataFile: datafile,
  performanceProfile: 'MaxPerformance',
  autoUpdate: false,
  updateMatchedUserAgent: true,
  usePredictiveGraph: true,
  usePerformanceGraph: false
}).build();

// To monitor the pipeline we can put in listeners for various log events.
// Valid types are info, debug, warn, error
pipeline.on('error', console.error);

// Here we make a function that gets a userAgent as evidence and
// uses the Device Detection Engine to detect if it is a mobile or not
const displayMatchMetrics = async function (userAgent) {
  // Create a FlowData element
  // This is used to add evidence and process it through the
  // FlowElements in the Pipeline.
  const flowData = pipeline.createFlowData();

  // Add the User-Agent as evidence
  flowData.evidence.add('header.user-agent', userAgent);

  // Run process on the flowData (this returns a promise)
  await flowData.process();

  const device = flowData.device;

  console.log('User-Agent: ' + userAgent);
  // Obtain the matched User-Agent: the matched substrings in the
  // User-Agent separated with underscored.
  console.log('Matched User-Agent: ' + device.userAgents.value);
  // Obtain the number of matched Nodes: the hash nodes matched
  // within the evidence.
  console.log('Matched Nodes: ' + device.matchedNodes.value);
  // Obtains the matched Device ID: the IDs of the matched profiles
  // separated with hyphens. Notice how the value changes depending
  // on the properties that are used with the builder. Profile IDs are
  // replaced with zeros when there are no properties associated with
  // the corresponding component available.
  console.log('Id: ' + device.deviceID.value);
  // Obtain difference: The total difference in hash code values
  // between the matched substrings and the actual substrings. The
  // maximum difference to allow when finding a match can be set
  // through the configuration structure.
  console.log('Difference: ' + device.difference.value);
  // Obtain drift: The maximum drift for a matched substring from the
  // character position where it was expected to be found. The maximum
  // drift to allow when finding a match can be set through the
  // configuration structure.
  console.log('Drift: ' + device.drift.value);
  // Obtain iteration count: The number of iterations required to get
  // the device offset in the devices collection in the graph of
  // nodes. This is indicative of the time taken to fetch the result.
  console.log('Iterations: ' + device.iterations.value);
  // Output the method that was used to obtain the result. Play with
  // the setUsePredictiveGraph and setUsePerformanceGraph values to
  // see the different results.
  console.log('Method: ' + device.method.value);
  // Use the internal FlowElement's properties array to printout all
  // the available values.
  Object.keys(device.flowElement.properties).forEach(function (property) {
      console.log(property + ': ' + device[property].value);
  })
};

const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36';

displayMatchMetrics(desktopUA);
