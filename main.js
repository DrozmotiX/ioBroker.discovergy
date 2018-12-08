// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const http_request = require("request");
let checkInterval;

// Create the adapter and define its methods
const adapter = utils.adapter({
	name: "discovergy",

	// The ready callback is called when databases are connected and adapter received configuration.
	// start here!
	ready: main, // Main method defined below for readability

	// is called when adapter shuts down - callback has to be called under any circumstances!
	unload: (callback) => {
		if (checkInterval != undefined) clearInterval(checkInterval);
		try {

			adapter.log.info("Discovergy adapter stopped, cleaning everything up :-) ");

			callback();

		} catch (e) {

			callback();

		}
	},
});

function main() {

	// Load username and password from adapter configuration
	const user = adapter.config.Username;
	const pass = adapter.config.Password;

	// We will call the API every 3 sekonds to receive data
	checkInterval = setInterval(function () {

		doDiscovergyCall(user, pass, "meters", "");

	}, 3000);

	// in this template all states changes inside the adapters namespace are subscribed
	adapter.subscribeStates("*");

}


// Function to retrieve basic data
function doDiscovergyCall(username, password, endpoint, urlencoded_parameters) {
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

				const administrationNumber = meterobjects.administrationNumber;
				const currentScalingFactor = meterobjects.currentScalingFactor;
				const firstMeasurementTime = meterobjects.firstMeasurementTime;
				const internalMeters = meterobjects.internalMeters;
				const lastMeasurementTime = meterobjects.lastMeasurementTime;
				const location = meterobjects.location;
				const measurementType = meterobjects.measurementType;
				const scalingFactor = meterobjects.scalingFactor;
				const serialNumber = meterobjects.serialNumber;
				const meterId = meterobjects.meterId;
				const type = meterobjects.type;
				const voltageScalingFactor = meterobjects.voltageScalingFactor;

				// Create Device Channel for Each found serialnumber
				adapter.setObject(serialNumber, {
					type: "device",
					common: {
						name: serialNumber,
					},
					native: {},
				});

				// Create all objects for basic information seperated by serialnumber of device
				doStateCreate(serialNumber + ".info" + ".administrationNumber", "Administrationsnummer", "number", "");
				adapter.setState(serialNumber + ".info" + ".administrationNumber", { val: "123456789", ack: true });

				//					doStateCreate(serialNumber + ".info" + ".currentScalingFactor","Jetziger skalierungsfactor","number","")
				//					adapter.setState(serialNumber + ".info" + ".currentScalingFactor", { val: currentScalingFactor, ack: true });

				doStateCreate(serialNumber + ".info" + ".firstMeasurementTime", "Erste Messung", "number", "");
				adapter.setState(serialNumber + ".info" + ".firstMeasurementTime", { val: firstMeasurementTime, ack: true });

				//					doStateCreate(serialNumber + ".info" + ".internalMeters","Anzahl interner Messgeraete","number","")
				//					adapter.setState(serialNumber + ".info" + ".internalMeters", { val: internalMeters, ack: true });

				//					doStateCreate(serialNumber + ".info" + ".Last_Timestamp","Letzte aktualisierung","number","")
				//					adapter.setState(serialNumber + ".info" + ".Last_Timestamp", { val: lastMeasurementTime, ack: true });

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

				//					doStateCreate(serialNumber + ".info" + ".scalingFactor","Skalierungsfactor","number","")
				//					adapter.setState(serialNumber + ".info" + ".scalingFactor", { val: scalingFactor, ack: true });

				doStateCreate(serialNumber + ".info" + ".serialNumber", "Seriennummer", "number", "");
				adapter.setState(serialNumber + ".info" + ".serialNumber", { val: serialNumber, ack: true });

				doStateCreate(serialNumber + ".info" + ".meterId", "Id des Messgeraetes", "number", "");
				adapter.setState(serialNumber + ".info" + ".meterId", { val: meterId, ack: true });

				doStateCreate(serialNumber + ".info" + ".type", "Device Type", "number", "");
				adapter.setState(serialNumber + ".info" + ".type", { val: type, ack: true });

				//					doStateCreate(serialNumber + ".info" + ".voltageScalingFactor","Voltage Skalierungsfactor","number","")
				//					adapter.setState(serialNumber + ".info" + ".voltageScalingFactor", { val: voltageScalingFactor, ack: true });

				// Fill objects for each value and fill with data of Discovergy
				const user = adapter.config.Username;
				const pass = adapter.config.Password;

				// Do not handle meter type RLM yet, unclear what kind of device this is and values provided
				if (type != "RLM") {

					doDiscovergyMeter(user, pass, "last_reading", meterId, serialNumber);

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

				}

			}
		} else { // error or non-200 status code
			adapter.log.error("Connection_Failed");
		}

	});

}

// Function to receive values specific from meter, meter ID must be provided in function call
function doDiscovergyMeter(username, password, endpoint, urlencoded_parameters, serial) {
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

				// Verify if JSON contains values which are implemented in Adapter, if proces values if not return error message
				switch (x) {
					case "power":

						doStateCreate(serial + ".Power", "Momentanwert jetziger Bezug", "number", "W");
						adapter.setState(serial + ".Power", { val: data.values[x] / 1000, ack: true });

						break;

					case "power1":

						doStateCreate(serial + ".Power_1", "Momentanwert jetziger Bezug T1", "number", "W");
						adapter.setState(serial + ".Power_1", { val: data.values[x] / 1000, ack: true });

						break;

					case "power2":

						doStateCreate(serial + ".Power_2", "Momentanwert jetziger Bezug T2", "number", "W");
						adapter.setState(serial + ".Power_2", { val: data.values[x] / 1000, ack: true });

						break;

					case "power3":

						doStateCreate(serial + ".Power_3", "Momentanwert jetziger Bezug T3", "number", "W");
						adapter.setState(serial + ".Power_3", { val: data.values[x] / 1000, ack: true });

						break;

					case "energy":

						doStateCreate(serial + ".Power_Total", "Zählerstand Bezug Gesamt", "number", "kWh");
						adapter.setState(serial + ".Power_Total", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energy1":

						doStateCreate(serial + ".Power_T1", "Zählerstand Bezug T1", "number", "kWh");
						adapter.setState(serial + ".Power_T1", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energy2":

						doStateCreate(serial + ".Power_T2", "Zählerstand Bezug T2", "number", "kWh");
						adapter.setState(serial + ".Power_T2", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut":

						doStateCreate(serial + ".Power_Out_Total", "Zählerstand Abgabe Gesammt", "number", "kWh");
						adapter.setState(serial + ".Power_Out_Total", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut1":

						doStateCreate(serial + ".Power_Out_T1", "Zählerstand Abgabe T1", "number", "kWh");
						adapter.setState(serial + ".Power_Out_T1", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut2":
						doStateCreate(serial + ".Power_Out_T2", "Zählerstand Abgabe T2", "number", "kWh");
						adapter.setState(serial + ".Power_Out_T2", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyProducer8":
						doStateCreate(serial + ".energyProducer_8", "energyProducer_8", "number", "kWh");
						adapter.setState(serial + ".energyProducer_8", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyProducer9":
						doStateCreate(serial + ".energyProducer_9", "energyProducer_9", "number", "kWh");
						adapter.setState(serial + ".energyProducer_9", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyProducer10":
						doStateCreate(serial + ".energyProducer_10", "energyProducer_9", "number", "kWh");
						adapter.setState(serial + ".energyProducer_10", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "voltage1":
						doStateCreate(serial + ".voltage_1", "Voltage", "number", "V");
						adapter.setState(serial + ".voltage_1", { val: data.values[x] / 1000, ack: true });

						break;

					case "voltage2":
						doStateCreate(serial + ".voltage_2", "Voltage", "number", "V");
						adapter.setState(serial + ".voltage_2", { val: data.values[x] / 1000, ack: true });

						break;

					case "voltage3":
						doStateCreate(serial + ".voltage_3", "Voltage", "number", "V");
						adapter.setState(serial + ".voltage_3", { val: data.values[x] / 1000, ack: true });

						break;

					case "volume":
						doStateCreate(serial + ".volume ", "Volume", "number", "m3");
						adapter.setState(serial + ".volume ", { val: data.values[x] / 1000, ack: true });

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

	adapter.setObject(id, {
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