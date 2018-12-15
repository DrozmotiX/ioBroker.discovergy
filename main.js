const utils = require("@iobroker/adapter-core");
const http_request = require("request");
let checkRestart_adapter ,checkInterval_short, checkInterval_long, user, pass, pull_Long, pull_Short;
let running = false;

// Create the adapter and define its methods
const adapter = utils.adapter({
	name: "discovergy",
	// start here!
	ready: main, // Main method defined below for readability
	// is called when adapter shuts down - callback has to be called under any circumstances!
	unload: (callback) => {
		if (checkInterval_short != undefined) clearTimeout(checkInterval_short);
		if (checkInterval_long != undefined) clearTimeout(checkInterval_long);
		if (checkRestart_adapter != undefined) clearTimeout(checkRestart_adapter);
		try {
			adapter.log.info("Discovergy adapter stopped, cleaning everything up :-) ");
			callback();
		} catch (e) {
			callback();
		}
	},
});

function main() {
	// Load configuration
	user = adapter.config.Username;
	pass = adapter.config.Password;
	//@ts-ignoreTS-ignore
	pull_Long = (adapter.config.pull_Long * 60000);
	//@ts-ignoreTS-ignore
	pull_Short = (adapter.config.pull_Short * 1000);

	if (user == undefined || pass == undefined){
	
		// Lets first ensure all data is read 1 time and all channels, devices etc are created.
		// After initialisation is finished the timers will start for short and long pulling
		doDiscovergyCall(user, pass, "meters", "","initialize");

		checkInterval_short = setInterval(function () {
			doDiscovergyCall(user, pass, "meters", "","short");
		}, pull_Short);

		checkInterval_long = setInterval(function () {
			doDiscovergyCall(user, pass, "meters", "","long");
		}, pull_Long);
	} else {
		adapter.log.error("*** Please enter Discovergy credentials in adapter settings ***");
		clearTimeout(checkRestart_adapter);
		checkRestart_adapter = setTimeout(function () {
			main();
		}, 30000);
	}
}

// Call Discovergy API en get an oerview of all meters present in your account and create objects with basic information
function doDiscovergyCall(username, password, endpoint, urlencoded_parameters, pulltype) {

	if (!running) {
		running = true;
	
		const requestUrl = `https://${username}:${password}@api.discovergy.com/public/v1/${endpoint}?${urlencoded_parameters}`;
		http_request(requestUrl, (error, response, body) => {

			if (!error && response.statusCode === 200) {
				// we got a response

				// Retrieve all meter objects from Discovergy API
				/** @type {Record<string, any>[]} */
				const objArray = JSON.parse(body);
				//				adapter.log.info(myStringArray[allobjects])
				for (const meterobjects of objArray) {

					//					adapter.log.info(allobjects + " : " + myStringArray[allobjects])

					// We dont use all values currenlty, some of them are not needed (if yes please create a pull request or issue)
					// const administrationNumber = meterobjects.administrationNumber;
					// const currentScalingFactor = meterobjects.currentScalingFactor;
					const firstMeasurementTime = meterobjects.firstMeasurementTime;
					// const internalMeters = meterobjects.internalMeters;
					// const lastMeasurementTime = meterobjects.lastMeasurementTime;
					const location = meterobjects.location;
					const measurementType = meterobjects.measurementType;
					// const scalingFactor = meterobjects.scalingFactor;
					const serialNumber = meterobjects.serialNumber;
					const meterId = meterobjects.meterId;
					const type = meterobjects.type;
					// const voltageScalingFactor = meterobjects.voltageScalingFactor;

					//	Only handle routine below wen adapter runs its first initalisation
					if (pulltype == "initialize"){
						// Create Device Channel for Each found serialnumber
						adapter.setObjectNotExists(serialNumber, {
							type: "device",
							common: {
								name: serialNumber,
							},
							native: {},
						});

						// Create all objects for basic information seperated by serialnumber of device
						doStateCreate(serialNumber + ".info" + ".administrationNumber", "Administrationsnummer", "number", "");
						adapter.setState(serialNumber + ".info" + ".administrationNumber", { val: "123456789", ack: true });

						//doStateCreate(serialNumber + ".info" + ".currentScalingFactor","Jetziger skalierungsfactor","number","")
						//adapter.setState(serialNumber + ".info" + ".currentScalingFactor", { val: currentScalingFactor, ack: true });

						doStateCreate(serialNumber + ".info" + ".firstMeasurementTime", "Erste Messung", "number", "");
						adapter.setState(serialNumber + ".info" + ".firstMeasurementTime", { val: firstMeasurementTime, ack: true });

						//doStateCreate(serialNumber + ".info" + ".internalMeters","Anzahl interner Messgeraete","number","")
						//adapter.setState(serialNumber + ".info" + ".internalMeters", { val: internalMeters, ack: true });
						//doStateCreate(serialNumber + ".info" + ".Last_Timestamp","Letzte aktualisierung","number","")
						//adapter.setState(serialNumber + ".info" + ".Last_Timestamp", { val: lastMeasurementTime, ack: true });

						// Locations are multiple values in an object and must be threated diffferently
						doStateCreate(serialNumber + ".info" + ".location.street", "Strasse", "string", "");
						adapter.setState(serialNumber + ".info" + ".location.street", { val: location.street, ack: true });

						doStateCreate(serialNumber + ".info" + ".location.streetNumber", "Hausnummer", "number", "");
						adapter.setState(serialNumber + ".info" + ".location.streetNumber", { val: location.streetNumber, ack: true });

						doStateCreate(serialNumber + ".info" + ".location.zip", "Ort", "Postleitzahl", "");
						adapter.setState(serialNumber + ".info" + ".location.zip", { val: location.zip, ack: true });

						doStateCreate(serialNumber + ".info" + ".location.city", "Ort", "string", "");
						adapter.setState(serialNumber + ".info" + ".location.city", { val: location.city, ack: true });

						doStateCreate(serialNumber + ".info" + ".location.country", "Land", "string", "");
						adapter.setState(serialNumber + ".info" + ".location.country", { val: location.country, ack: true });

						doStateCreate(serialNumber + ".info" + ".measurementType", "Energy Type", "string", "");
						adapter.setState(serialNumber + ".info" + ".measurementType", { val: measurementType, ack: true });

						//doStateCreate(serialNumber + ".info" + ".scalingFactor","Skalierungsfactor","number","")
						//adapter.setState(serialNumber + ".info" + ".scalingFactor", { val: scalingFactor, ack: true });

						doStateCreate(serialNumber + ".info" + ".serialNumber", "Seriennummer", "number", "");
						adapter.setState(serialNumber + ".info" + ".serialNumber", { val: serialNumber, ack: true });

						doStateCreate(serialNumber + ".info" + ".meterId", "Id des Messgeraetes", "number", "");
						adapter.setState(serialNumber + ".info" + ".meterId", { val: meterId, ack: true });

						doStateCreate(serialNumber + ".info" + ".type", "Device Type", "number", "");
						adapter.setState(serialNumber + ".info" + ".type", { val: type, ack: true });

						//doStateCreate(serialNumber + ".info" + ".voltageScalingFactor","Voltage Skalierungsfactor","number","")
						//adapter.setState(serialNumber + ".info" + ".voltageScalingFactor", { val: voltageScalingFactor, ack: true });
					}

					// Loop on all objects to Verify if JSON contains values which are not yet implemented in Adapter, if implemented do nothing if not return error message
					for (const x in meterobjects) {
						//						adapter.log.info(x + " : " + meterobjects[x])
						switch (x) {
							case "administrationNumber":
							case "currentScalingFactor":
							case "firstMeasurementTime":
							case "internalMeters":
							case "lastMeasurementTime":
							case "location":
							case "measurementType":
							case "meterId":
							case "scalingFactor":
							case "serialNumber":
							case "type":
							case "voltageScalingFactor":
								break;

							default:

								adapter.log.error("Information received from Discovergy which is not yet part of this adapter");
								adapter.log.error("Send this information to developer : " + x + " : " + meterobjects[x]);
						}

						// Do not handle meter type RLM yet, unclear what kind of device this is and values provided
						if (type != "RLM") {
							doDiscovergyMeter(user, pass, "last_reading", meterId, serialNumber,pulltype);
						}
					}
				}
			} else { // error or non-200 status code
				adapter.log.error("Connection_Failed : " + error);
			}
		});
		running = false;
	}
}

// Function to receive values from specific meter
function doDiscovergyMeter(username, password, endpoint, urlencoded_parameters, serial,pulltype) {
	const requestUrl = `https://${username}:${password}@api.discovergy.com/public/v1/${endpoint}?meterId=${urlencoded_parameters}`;
	http_request(requestUrl, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			// we got a response

			const result = body;
			//			adapter.log.info("query result of meter : " + result)
			const data = JSON.parse(result);

			doStateCreate(serial + "._Last_Sync", "Zeitpunkt Letzte Syncronisierung", "number", "");
			adapter.setState(serial + "._Last_Sync", { val: data.time, ack: true });

			for (const x in data.values) {

				// Verify if JSON contains values which are implemented in Adapter, if yes proces values if not return error message
				// This must be improve in later version to handle outside of hard-coded and move to configuration file
				// Only power and voltage states will be run in "short" interval, all others less frequent (not needed and better)
				// Creation of new objects is limited to adapter start
				switch (x) {
					case "power":

						if (pulltype == "initialize") doStateCreate(serial + ".Power", "Momentanwert jetziger Bezug", "number", "W");
						if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".Power", { val: data.values[x] / 1000, ack: true });

						// Seperate states for usage and delivery
						if (pulltype == "initialize" && data.values[x] > 0) doStateCreate(serial + ".Power_Usage", "Momentanwert jetzige Abnahme", "number", "W");
						if ((pulltype == "initialize" || pulltype == "short") && data.values[x] > 0) adapter.setState(serial + ".Power_Usage", { val: data.values[x] / 1000, ack: true });
						if (pulltype == "initialize" && data.values[x] < 0) doStateCreate(serial + ".Power_Delivery", "Momentanwert jetzige Abgabe", "number", "W");
						if ((pulltype == "initialize" || pulltype == "short") && data.values[x] < 0) adapter.setState(serial + ".Power_Delivery", { val: data.values[x] / 1000, ack: true });

						break;

					case "power1":

						if (pulltype == "initialize") doStateCreate(serial + ".Power_1", "Momentanwert jetziger Bezug T1", "number", "W");
						if (pulltype == "initialize" || pulltype == "short")adapter.setState(serial + ".Power_1", { val: data.values[x] / 1000, ack: true });
						// Seperate states for usage and delivery
						if (pulltype == "initialize" && data.values[x] > 0) doStateCreate(serial + ".Power_1_Usage", "Momentanwert jetzige Abnahme T1", "number", "W");
						if ((pulltype == "initialize" || pulltype == "short") && data.values[x] > 0) adapter.setState(serial + ".Power_1_Usage", { val: data.values[x] / 1000, ack: true });
						if (pulltype == "initialize" && data.values[x] < 0) doStateCreate(serial + ".Power_1_Delivery", "Momentanwert jetzige Abgabe T1", "number", "W");
						if ((pulltype == "initialize" || pulltype == "short") && data.values[x] < 0) adapter.setState(serial + ".Power_1_Delivery", { val: data.values[x] / 1000, ack: true });

						break;

					case "power2":

						if (pulltype == "initialize") doStateCreate(serial + ".Power_2", "Momentanwert jetziger Bezug T2", "number", "W");
						if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".Power_2", { val: data.values[x] / 1000, ack: true });
						// Seperate states for usage and delivery						
						if (pulltype == "initialize" && data.values[x] > 0) doStateCreate(serial + ".Power_2_Usage", "Momentanwert jetzige Abnahme T2", "number", "W");
						if ((pulltype == "initialize" || pulltype == "short") && data.values[x] > 0) adapter.setState(serial + ".Power_2_Usage", { val: data.values[x] / 1000, ack: true });
						if (pulltype == "initialize" && data.values[x] < 0) doStateCreate(serial + ".Power_2_Delivery", "Momentanwert jetzige Abgabe T2", "number", "W");
						if ((pulltype == "initialize" || pulltype == "short") && data.values[x] < 0) adapter.setState(serial + ".Power_2_Delivery", { val: data.values[x] / 1000, ack: true });
						
						break;

					case "power3":

						if (pulltype == "initialize") doStateCreate(serial + ".Power_3", "Momentanwert jetziger Bezug T3", "number", "W");
						if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".Power_3", { val: data.values[x] / 1000, ack: true });
						// Seperate states for usage and delivery						
						if (pulltype == "initialize" && data.values[x] > 0) doStateCreate(serial + ".Power_3_Usage", "Momentanwert jetzige Abnahme T3", "number", "W");
						if ((pulltype == "initialize" || pulltype == "short") && data.values[x] > 0) adapter.setState(serial + ".Power_3_Usage", { val: data.values[x] / 1000, ack: true });
						if (pulltype == "initialize" && data.values[x] < 0) doStateCreate(serial + ".Power_3_Delivery", "Momentanwert jetzige Abgabe T3", "number", "W");
						if ((pulltype == "initialize" || pulltype == "short") && data.values[x] < 0) adapter.setState(serial + ".Power_3_Delivery", { val: data.values[x] / 1000, ack: true });
						break;

					case "energy":

						if (pulltype == "initialize") doStateCreate(serial + ".Power_Total", "Zählerstand Bezug Gesamt", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".Power_Total", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energy1":

						if (pulltype == "initialize") doStateCreate(serial + ".Power_T1", "Zählerstand Bezug T1", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".Power_T1", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energy2":

						if (pulltype == "initialize") doStateCreate(serial + ".Power_T2", "Zählerstand Bezug T2", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".Power_T2", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut":

						if (pulltype == "initialize") doStateCreate(serial + ".Power_Out_Total", "Zählerstand Abgabe Gesammt", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".Power_Out_Total", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut1":

						if (pulltype == "initialize") doStateCreate(serial + ".Power_Out_T1", "Zählerstand Abgabe T1", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".Power_Out_T1", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut2":
						if (pulltype == "initialize") doStateCreate(serial + ".Power_Out_T2", "Zählerstand Abgabe T2", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".Power_Out_T2", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyProducer8":
						if (pulltype == "initialize") doStateCreate(serial + ".energyProducer_8", "energyProducer_8", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".energyProducer_8", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyProducer9":
						if (pulltype == "initialize") doStateCreate(serial + ".energyProducer_9", "energyProducer_9", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".energyProducer_9", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyProducer10":
						if (pulltype == "initialize") doStateCreate(serial + ".energyProducer_10", "energyProducer_9", "number", "kWh");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".energyProducer_10", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "voltage1":
						if (pulltype == "initialize") doStateCreate(serial + ".voltage_1", "Voltage", "number", "V");
						if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".voltage_1", { val: data.values[x] / 1000, ack: true });

						break;

					case "voltage2":
						if (pulltype == "initialize") doStateCreate(serial + ".voltage_2", "Voltage", "number", "V");
						if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".voltage_2", { val: data.values[x] / 1000, ack: true });

						break;

					case "voltage3":
						if (pulltype == "initialize") doStateCreate(serial + ".voltage_3", "Voltage", "number", "V");
						if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".voltage_3", { val: data.values[x] / 1000, ack: true });

						break;

					case "volume":
						if (pulltype == "initialize") doStateCreate(serial + ".volume ", "Volume", "number", "m3");
						if (pulltype == "initialize" || pulltype == "long") adapter.setState(serial + ".volume ", { val: data.values[x] / 1000, ack: true });

						break;

					default:

						adapter.log.error("Information received from Discovergy which is not yet part of this adapter");
						adapter.log.error("Send this information to developer : " + "Device = " + serial + " AttrName : " + x + " : " + data.values[x]);
				}
			}
		} else { // error or non-200 status code
			adapter.log.error("Connection_Failed");
		}
	});
}

//Function to handle state creation
function doStateCreate(id, name, type, unit) {

	adapter.setObjectNotExists(id, {
		type: "state",
		common: {
			name: name,
			type: type,
			role: "value.state",
			read: true,
			unit: unit,
			write: false,
		},
		native: {},
	});
}