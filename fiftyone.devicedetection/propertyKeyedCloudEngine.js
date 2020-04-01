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

let require51 = (requestedPackage) => {
    try {
        return require(__dirname + "/../" + requestedPackage)
    } catch (e) {
        return require(requestedPackage);
    }
}

const engines = require51("fiftyone.pipeline.engines");
const engine = engines.engine;
const aspectDataDictionary = engines.aspectDataDictionary;
const aspectPropertyValue = engines.aspectPropertyValue;

class propertyKeyedCloudEngine extends engine {

    constructor() {

        super(...arguments);

        this.dataKey = "devices";

    }

    /**
     * The property-keyed cloud engine requires the 51Degrees cloudRequestEngine 
     * to be placed in a pipeline before it. It simply takes that raw JSON 
     * response and parses it to extract the relevant data
     * @param {flowData} flowData
    */
    processInternal(flowData) {

        let engine = this;

        this.checkProperties(flowData).then(function (params) {

            let cloudData = flowData.get("cloud").get("cloud");

            cloudData = JSON.parse(cloudData);

            // Loop over cloudData.devices properties to check if they have a value

            let devices = [];

            Object.entries(cloudData.devices.devices).forEach(function([deviceKey,deviceValues]){

                let device = {};

                Object.entries(deviceValues).forEach(function([propertyKey,propertyValue]){

                    device[propertyKey] = new aspectPropertyValue();
                    
                    device[propertyKey].value = propertyValue;

                });

                devices.push(device);
            });

            let result = { "devices": devices };

            let data = new aspectDataDictionary(
                {
                    flowElement: engine,
                    contents: result
                });

            flowData.setElementData(data);

        });

    }

    checkProperties(flowData) {

        let engine = this;

        return new Promise(function (resolve, reject) {

            // Check if properties set, if not set them

            if (!Object.keys(engine.properties).length) {

                let cloudProperties = flowData.get("cloud").get("properties");

                let devicesProperties = cloudProperties.devices;

                engine.properties = devicesProperties;

                engine.updateProperties().then(resolve);

            } else {

                resolve();

            }

        });

    }

}

module.exports = propertyKeyedCloudEngine;
