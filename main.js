// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const http_request = require("request");
var user
var pass
// Create the adapter and define its methods
const adapter = utils.adapter({
	name: "discovergy",

	// The ready callback is called when databases are connected and adapter received configuration.
	// start here!
	ready: main, // Main method defined below for readability

	// is called when adapter shuts down - callback has to be called under any circumstances!
	unload: (callback) => {
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
	var user = adapter.config.Username;
	var pass = adapter.config.Password;

	// We will call the API every 3 sekonds to receive data
	interval = setInterval(function () {

		doDiscovergyCall(user,pass,"meters","").then(function(meters) {

		})

	}, 3000);

	// in this template all states changes inside the adapters namespace are subscribed
	adapter.subscribeStates("*");

}


// Function to retrieve basic data
function doDiscovergyCall(username, password,endpoint,urlencoded_parameters) {
	return new Promise(function (resolve, reject)  {
		http_request("https://" + username + ":" + password + "@api.discovergy.com/public/v1/" + endpoint+"?" + urlencoded_parameters,function(r,e,b) {

			try {

				// Retrieve all meter objects from Discovergy API
				var allobjects, len, myStringArray = JSON.parse(b);
//				adapter.log.info(myStringArray[allobjects])
				for (len = myStringArray.length, allobjects=0; allobjects<len; ++allobjects) {

//					adapter.log.info(allobjects + " : " + myStringArray[allobjects])

					meterobjects = myStringArray[allobjects]
					var administrationNumber = meterobjects.administrationNumber
					var currentScalingFactor = meterobjects.currentScalingFactor
					var firstMeasurementTime = meterobjects.firstMeasurementTime
					var internalMeters = meterobjects.internalMeters
					var lastMeasurementTime = meterobjects.lastMeasurementTime
					var location = meterobjects.location
					var measurementType = meterobjects.measurementType
					var scalingFactor = meterobjects.scalingFactor				
					var serialNumber = meterobjects.serialNumber
					var meterId = meterobjects.meterId
					var type = meterobjects.type
					var voltageScalingFactor = meterobjects.voltageScalingFactor

					// Create Device Channel for Each found serialnumber
					adapter.setObject(serialNumber, {
						type: "device",
						common: {
							name: serialNumber,
						},
						native: {},
					});	

					// Create all objects for basic information seperated by serialnumber of device
					doStateCreate(serialNumber + ".info" + ".administrationNumber","Administrationsnummer","number","")
					adapter.setState(serialNumber + ".info" + ".administrationNumber", { val: "123456789", ack: true });

//					doStateCreate(serialNumber + ".info" + ".currentScalingFactor","Jetziger skalierungsfactor","number","")
//					adapter.setState(serialNumber + ".info" + ".currentScalingFactor", { val: currentScalingFactor, ack: true });

					doStateCreate(serialNumber + ".info" + ".firstMeasurementTime","Erste Messung","number","")
					adapter.setState(serialNumber + ".info" + ".firstMeasurementTime", { val: firstMeasurementTime, ack: true });

//					doStateCreate(serialNumber + ".info" + ".internalMeters","Anzahl interner Messgeraete","number","")
//					adapter.setState(serialNumber + ".info" + ".internalMeters", { val: internalMeters, ack: true });

//					doStateCreate(serialNumber + ".info" + ".Last_Timestamp","Letzte aktualisierung","number","")
//					adapter.setState(serialNumber + ".info" + ".Last_Timestamp", { val: lastMeasurementTime, ack: true });

					// Locations are multiple values in an object and must be threated diffferently
					doStateCreate(serialNumber + ".info" + ".location.street","Strasse","string","")
					adapter.setState(serialNumber + ".info" + ".location.street", { val: location.street, ack: true });

					doStateCreate(serialNumber + ".info" + ".location.streetNumber","Hausnummer","number","")
					adapter.setState(serialNumber + ".info" + ".location.streetNumber", { val: location.streetNumber, ack: true });

					doStateCreate(serialNumber + ".info" + ".location.zip","Ort","Postleitzahl","")
					adapter.setState(serialNumber + ".info" + ".location.zip", { val: location.zip, ack: true });

					doStateCreate(serialNumber + ".info" + ".location.city","Ort","string","")
					adapter.setState(serialNumber + ".info" + ".location.city", { val: location.city, ack: true });

					doStateCreate(serialNumber + ".info" + ".location.country","Land","string","")
					adapter.setState(serialNumber + ".info" + ".location.country", { val: location.country, ack: true });

					doStateCreate(serialNumber + ".info" + ".measurementType","Energy Type","string","")
					adapter.setState(serialNumber + ".info" + ".measurementType", { val: measurementType, ack: true });

//					doStateCreate(serialNumber + ".info" + ".scalingFactor","Skalierungsfactor","number","")
//					adapter.setState(serialNumber + ".info" + ".scalingFactor", { val: scalingFactor, ack: true });

					doStateCreate(serialNumber + ".info" + ".serialNumber","Seriennummer","number","")
					adapter.setState(serialNumber + ".info" + ".serialNumber", { val: serialNumber, ack: true });

					doStateCreate(serialNumber + ".info" + ".meterId","Id des Messgeraetes","number","")
					adapter.setState(serialNumber + ".info" + ".meterId", { val: meterId, ack: true });

					doStateCreate(serialNumber + ".info" + ".type","Device Type","number","")
					adapter.setState(serialNumber + ".info" + ".type", { val: type, ack: true });

//					doStateCreate(serialNumber + ".info" + ".voltageScalingFactor","Voltage Skalierungsfactor","number","")
//					adapter.setState(serialNumber + ".info" + ".voltageScalingFactor", { val: voltageScalingFactor, ack: true });

					// Fill objects for each value and fill with data of Discovergy
					var user = adapter.config.Username;
					var pass = adapter.config.Password;

					// Do not handle meter type RLM yet, unclear what kind of device this is and values provided
					if (type != "RLM") {

						doDiscovergyMeter(user,pass,"last_reading",meterId,serialNumber).then(function(last_reading) {

							adapter.log.error("Device Type : " + type + " received which is currenlty not supported")
	
						})

					}
					
					// Loop on all objects to Verify if JSON contains values which are not yet implemented in Adapter, if implemented do nothing if not return error message
					for (x in meterobjects) {

//						adapter.log.info(x + " : " + meterobjects[x])

						switch(x) {
							case "administrationNumber":
								
								break;

							case "currentScalingFactor":
								
								break;

							case "firstMeasurementTime":
								
								break;

							case "internalMeters":
						
								break;

							case "lastMeasurementTime":
								
								break;

							case "location":
								
								break;

							case "measurementType":
					
								break;

							case "meterId":
								
								break;

							case "scalingFactor":
								
								break;

							case "serialNumber":

								break;

							case "type":
							
								break;

							case "voltageScalingFactor":
								
								break;

							default:
					
								adapter.log.error("Information received from Discovergy which is not yet part of this adapter")
								adapter.log.error("Send this information to developer : " + x + " : " + meterobjects[x])
						}

					}

				}

			// Handle error in case of connection issue
			} catch (error) {

				adapter.log.error("Connection_Failed")
				
			}

		});

	});

}

// Function to receive values specific from meter, meter ID must be provided in function call
function doDiscovergyMeter(username, password,endpoint,urlencoded_parameters,serial) {
	return new Promise(function (resolve, reject)  {
		http_request("https://" + username + ":" + password + "@api.discovergy.com/public/v1/" + endpoint + "?" + "meterId=" + urlencoded_parameters,function(r,e,b) {
			result = b
			adapter.log.info("query result of meter : " + result)
			data = JSON.parse(result);

			lastsync = data.time
			doStateCreate(serial + "._Last_Sync","Zeitpunkt Letzte Syncronisierung","number","")
			adapter.setState(serial + "._Last_Sync", { val: data.time, ack: true });

			for (x in data.values) {

				// Verify if JSON contains values which are implemented in Adapter, if proces values if not return error message
				switch(x) {
					case "power":

						doStateCreate(serial + ".Power","Momentanwert jetziger Bezug","number","W")
						adapter.setState(serial + ".Power", { val: data.values[x] / 1000, ack: true });
												
						break;

					case "power1":

						doStateCreate(serial + ".Power_1","Momentanwert jetziger Bezug T1","number","W")
						adapter.setState(serial + ".Power_1", { val: data.values[x] / 1000, ack: true });
						
						break;

					case "power2":

						doStateCreate(serial + ".Power_2","Momentanwert jetziger Bezug T2","number","W")
						adapter.setState(serial + ".Power_2", { val: data.values[x] / 1000, ack: true });
						
						break;

					case "power3":

						doStateCreate(serial + ".Power_3","Momentanwert jetziger Bezug T3","number","W")
						adapter.setState(serial + ".Power_3", { val: data.values[x] / 1000, ack: true });
												
						break;

					case "energy":

						doStateCreate(serial + ".Power_Total","Zählerstand Bezug Gesamt","number","kWh")
						adapter.setState(serial + ".Power_Total", { val: data.values[x] / 10000000000, ack: true });
						
						break;

					case "energy1":

						doStateCreate(serial + ".Power_T1","Zählerstand Bezug T1","number","kWh")
						adapter.setState(serial + ".Power_T1", { val: data.values[x] / 10000000000, ack: true });
						
						break;

					case "energy2":

						doStateCreate(serial + ".Power_T2","Zählerstand Bezug T2","number","kWh")
						adapter.setState(serial + ".Power_T2", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut":

						doStateCreate(serial + ".Power_Out_Total","Zählerstand Abgabe Gesammt","number","kWh")
						adapter.setState(serial + ".Power_Out_Total", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut1":

						doStateCreate(serial + ".Power_Out_T1","Zählerstand Abgabe T1","number","kWh")
						adapter.setState(serial + ".Power_Out_T1", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut2":
						doStateCreate(serial + ".Power_Out_T2","Zählerstand Abgabe T2","number","kWh")
						adapter.setState(serial + ".Power_Out_T2", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyProducer8":
						doStateCreate(serial + ".energyProducer_8","energyProducer_8","number","kWh")
						adapter.setState(serial + ".energyProducer_8", { val: data.values[x] / 10000000000, ack: true });

						break;
					
					case "energyProducer9":
						doStateCreate(serial + ".energyProducer_9","energyProducer_9","number","kWh")
						adapter.setState(serial + ".energyProducer_9", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyProducer10":
						doStateCreate(serial + ".energyProducer_10","energyProducer_9","number","kWh")
						adapter.setState(serial + ".energyProducer_10", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "voltage1":
						doStateCreate(serial + ".voltage_1","Voltage","number","V")
						adapter.setState(serial + ".voltage_1", { val: data.values[x] / 1000, ack: true });

						break;	

					case "voltage2":
						doStateCreate(serial + ".voltage_2","Voltage","number","V")
						adapter.setState(serial + ".voltage_2", { val: data.values[x] / 1000, ack: true });

						break;	

					case "voltage3":
						doStateCreate(serial + ".voltage_3","Voltage","number","V")
						adapter.setState(serial + ".voltage_3", { val: data.values[x] / 1000, ack: true });

						break;	

					case "volume":
						doStateCreate(serial + ".volume ","Volume","number","m3")
						adapter.setState(serial + ".volume ", { val: data.values[x] / 1000, ack: true });

						break;						

					default:
			
						adapter.log.error("Information received from Discovergy which is not yet part of this adapter")
						adapter.log.error("Send this information to developer : " + "Device = "+ serial + " AttrName : " + x + " : " + data.values[x])
				}
			}
		});
	});
}

//Function to handle state creation
function doStateCreate(id,name,type,unit) {

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