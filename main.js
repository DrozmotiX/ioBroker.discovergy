// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const http_request = require("request");

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
			result = (b.slice(1, b.length - 1))
			data = JSON.parse(result);

			adapter.setObject("info", {
				type: "channel",
				common: {
					name: "info",
				},
				native: {},
			});	

			for (x in data) {
    
//				adapter.log.info(x + " : " + data[x])
			
				// State Seperation
				switch(x) {
					case "meterId":

						// Load username and password from adapter configuration
						var user = adapter.config.Username;
						var pass = adapter.config.Password;
						var meterID = data[x]
				
						doDiscovergyMeter(user,pass,"last_reading",meterID).then(function(last_reading) {
 
						})

						break;                                                                        
				}

			}
    
		});

	});

}


// Function to receive values specific from meter, meter ID must be provided in function call
function doDiscovergyMeter(username, password,endpoint,urlencoded_parameters) {
	return new Promise(function (resolve, reject)  {
		http_request("https://" + username + ":" + password + "@api.discovergy.com/public/v1/" + endpoint + "?" + "meterId=" + urlencoded_parameters,function(r,e,b) {
			result = b
			adapter.log.info("query result of meter : " + result)
			data = JSON.parse(result);
			
			adapter.setObject(urlencoded_parameters, {
				type: "device",
				common: {
					name: urlencoded_parameters,
				},
				native: {},
			});			

			// State to store last syncronisation time
			doStateCreate(urlencoded_parameters + ".Last_Timestamp","Letzte aktualisierung","number","")
			adapter.setState(urlencoded_parameters + ".Last_Timestamp", { val: data.time, ack: true });

			for (x in data.values) {

				// State Seperation
				switch(x) {
					case "power":

						doStateCreate(urlencoded_parameters + ".Power","Momentanwert jetziger Bezug","number","W")
						adapter.setState(urlencoded_parameters + ".Power", { val: data.values[x] / 1000, ack: true });
						
						
						break;

					case "power1":

						doStateCreate(urlencoded_parameters + ".Power_1","Momentanwert jetziger Bezug T1","number","W")
						adapter.setState(urlencoded_parameters + ".Power_1", { val: data.values[x] / 1000, ack: true });
						
						break;

					case "power2":

						doStateCreate(urlencoded_parameters + ".Power_2","Momentanwert jetziger Bezug T2","number","W")
						adapter.setState(urlencoded_parameters + ".Power_2", { val: data.values[x] / 1000, ack: true });
						
						
						break;


					case "energy":

						doStateCreate(urlencoded_parameters + ".Power_Total","Zählerstand Bezug Gesamt","number","kWh")
						adapter.setState(urlencoded_parameters + ".Power_Total", { val: data.values[x] / 10000000000, ack: true });
						break;

					case "energy1":

						doStateCreate(urlencoded_parameters + ".Power_T1","Zählerstand Bezug T1","number","kWh")
						adapter.setState(urlencoded_parameters + ".Power_T1", { val: data.values[x] / 10000000000, ack: true });
						break;

					case "energy2":

						doStateCreate(urlencoded_parameters + ".Power_T2","Zählerstand Bezug T2","number","kWh")
						adapter.setState(urlencoded_parameters + ".Power_T2", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut":

						doStateCreate(urlencoded_parameters + ".Power_Out_Total","Zählerstand Abgabe Gesammt","number","kWh")
						adapter.setState(urlencoded_parameters + ".Power_Out_Total", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut1":

						doStateCreate(urlencoded_parameters + ".Power_Out_T1","Zählerstand Abgabe T1","number","kWh")
						adapter.setState(urlencoded_parameters + ".Power_Out_T1", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "energyOut2":
						doStateCreate(urlencoded_parameters + ".Power_Out_T2","Zählerstand Abgabe T2","number","kWh")
						adapter.setState(urlencoded_parameters + ".Power_Out_T2", { val: data.values[x] / 10000000000, ack: true });

						break;

					case "voltage1":
						doStateCreate(urlencoded_parameters + ".voltage_1","Voltage","number","V")
						adapter.setState(urlencoded_parameters + ".voltage_1", { val: data.values[x] / 1000, ack: true });

						break;						

					case "voltage2":
						doStateCreate(urlencoded_parameters + ".voltage_2","Voltage","number","V")
						adapter.setState(urlencoded_parameters + ".voltage_2", { val: data.values[x] / 1000, ack: true });

						break;	

					case "voltage3":
						doStateCreate(urlencoded_parameters + ".voltage_3","Voltage","number","V")
						adapter.setState(urlencoded_parameters + ".voltage_3", { val: data.values[x] / 1000, ack: true });

						break;	

					default:
			
						adapter.log.error("Information received from Discovergy which is not yet part of this adapter")
						adapter.log.error("Send this information to developer : " + x + data.values[x])
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