"use strict";

/*
 * Created with @iobroker/create-adapter v1.16.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const http_request = require("request");
const state_attr = require(__dirname + "/lib/state_attr.js"), all_meters = [];
let user, pass;
// Load your modules here, e.g.:
// const fs = require("fs");

class Discovergy extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "discovergy",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {

		this.setState("info.connection", false, true);
		this.log.info("Discovergy Adapter startet, trying to discover meters associated with your account");

		user = this.config.Username;
		
		// Check if credentials are not empty and decrypt stored password
		if (user !== "" && pass !== ""){
			this.getForeignObject("system.config", (err, obj) => {
				if (obj && obj.native && obj.native.secret) {
				//noinspection JSUnresolvedVariable
					pass = this.decrypt(obj.native.secret, this.config.Password);
				} else {
				//noinspection JSUnresolvedVariable
					pass = this.decrypt("Zgfr56gFe87jJOM", this.config.Password);
				}
				
				// Make a call to discovergai API and get a list of all meters
				this.doDiscovergyCall(user, pass, "meters", "");
		
			});
		} else {
			this.log.error("*** Adapter deactivated, credentials missing in Adaptper Settings !!!  ***");
			this.setForeignState("system.this." + this.namespace + ".alive", false);
		}
	}

	doDiscovergyCall(username, password, endpoint, urlencoded_parameters) {

		const requestUrl = `https://${username}:${password}@api.discovergy.com/public/v1/${endpoint}?${urlencoded_parameters}`;
		http_request(requestUrl, (error, response, body) => {
	
			if (!error && response.statusCode === 200) {
				this.setState("info.connection", true, true);
				// we got a response
	
				// Retrieve all meter objects from Discovergy API
				/** @type {Record<string, any>[]} */
				const objArray = JSON.parse(body);	
				this.log.debug(JSON.stringify(objArray));

				// Run truth array off all meter
				for (const i in objArray){

					// Create device and info channel
					this.log.debug(JSON.stringify(objArray[i]));
					this.createDevice(objArray[i]["serialNumber"]);
					this.createChannel(objArray[i]["serialNumber"],"info");

					// Create info channel for alle meter devices
					for (const x in objArray[i]){

						if (state_attr[x] === undefined){
							this.log.error("State type : " + x + " unknown, send this information to the developer ==> " + x + " : " + JSON.stringify(objArray[i][x]));
						} else {
							this.doStateCreate(objArray[i]["serialNumber"] + ".info." + x,state_attr[x].type,state_attr[x].role,state_attr[x].read,state_attr[x].unit,state_attr[x].write)

							this.setObjectNotExists(objArray[i]["serialNumber"] + ".info." + x, {
								type: "state",
								common: {
									name: x,
									type: state_attr[x].type,
									role: state_attr[x].role,
									read: state_attr[x].read,
									unit: state_attr[x].unit,
									write: state_attr[x].write,
								},
								native: {},
							});
							this.setState(objArray[i]["serialNumber"] + ".info." + x, objArray[i][x], true);
						}
					}

					if (objArray[i]["type"] !== "RLM") {
						const serialNumber = objArray[i]["serialNumber"];
						const meterId = objArray[i]["meterId"];
						const test = {
							"meterId": meterId,
							"serialNumber":  serialNumber
						};
					
						// Build array with all meter (used later for data polling)
						all_meters.push(test);
						// this.doDiscovergyMeter(user, pass, "last_reading", meterId, serialNumber,pulltype);
					}
				}

				this.log.debug("All meters : " + JSON.stringify(all_meters));
				
				for (const z in all_meters) {
					this.log.debug(JSON.stringify(all_meters[z]));
					// this.log.info("Test alle meter run");
					this.doDiscovergyMeter(user, pass, "last_reading", all_meters[z].meterId, all_meters[z].serialNumber);
					this.log.info("Discovergy meter found at your account with serial  : " + all_meters[z].serialNumber);

				}

			} else { // error or non-200 status code
				this.log.error("Connection_Failed at meter indication run, check your credentials !");
				this.setState("info.connection", false, true);
			}
		});
	}

	async doStateCreate(state, name, type, role, read, unit, write){


		this.setObjectNotExists(state, {
			type: "state",
			common: {
				name: name,
				type: type,
				role: role,
				read: read,
				unit: unit,
				write: write,
			},
			native: {},
		});

	}

	doDiscovergyMeter(username, password, endpoint, urlencoded_parameters, serial) {
		const requestUrl = `https://${username}:${password}@api.discovergy.com/public/v1/${endpoint}?meterId=${urlencoded_parameters}`;
		http_request(requestUrl, (error, response, body) => {

			// Run this routine again in 10 seconds (update intervall for meters)
			setTimeout( () => {
				this.doDiscovergyMeter(username, password, endpoint, urlencoded_parameters, serial);
			}, 10000);

			if (!error && response.statusCode === 200) {
				// we got a response
	
				const result = body;
				const data = JSON.parse(result);

				for (const i in data) {

					for (const x in data[i]) {

						if (state_attr[x] === undefined){
							this.log.error("State type : " + x + " unknown, send this information to the developer ==> " + x + " : " + JSON.stringify(data[i][x]));
						} else {

							if (state_attr[x].type !== undefined) {

								switch (x) {
									case "power":
										if (data[i][x] > 0) {
											this.doStateCreate(serial + ".Power_Usage", 'Momentanwert jetzige Abnahme', state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_Usage", data[i][x], x);
										} else {
											this.doStateCreate(serial + ".Power_Delivery", 'Momentanwert jetziger Abgabe', state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_Delivery", data[i][x], x);										
										}
	
										break;

									case "power1":
											if (data[i][x] > 0) {
												this.doStateCreate(serial + ".Power_T1_Usage", 'Momentanwert jetzige Abnahme T1', state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
												this.calc_factor(serial + ".Power_T1_Usage", data[i][x], x);
											} else {
												this.doStateCreate(serial + ".Power_T1_Delivery", 'Momentanwert jetziger Abgabe T1', state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
												this.calc_factor(serial + ".Power_T1_Delivery", data[i][x], x);										
											}
	
									case "power2":
											if (data[i][x] > 0) {
												this.doStateCreate(serial + ".Power_T2_Usage", 'Momentanwert jetzige Abnahme T2', state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
												this.calc_factor(serial + ".Power_T2_Usage", data[i][x], x);
											} else {
												this.doStateCreate(serial + ".Power_T2_Delivery", 'Momentanwert jetziger Abgabe T2', state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
												this.calc_factor(serial + ".Power_T2_Delivery", data[i][x], x);										
											}

										break;
	
									case "power3":
											if (data[i][x] > 0) {
												this.doStateCreate(serial + ".Power_T3_Usage", 'Momentanwert jetzige Abnahme T3', state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
												this.calc_factor(serial + ".Power_T3_Usage", data[i][x], x);
											} else {
												this.doStateCreate(serial + ".Power_T3_Delivery", 'Momentanwert jetziger Abgabe T3', state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
												this.calc_factor(serial + ".Power_T3_Delivery", data[i][x], x);										
											}

										break;
	
									default:
	
											this.doStateCreate(serial + "." + x, x, state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + "." + x, data[i][x], x);
	
								}


								// this.setObjectNotExists(serial + "." + x, {
								// 	type: "state",
								// 	common: {
								// 		name: state_attr[x].name,
								// 		type: state_attr[x].type,
								// 		role: state_attr[x].role,
								// 		unit: state_attr[x].unit,
								// 		write: false
								// 	},
								// 	native: {},
								// });

								// this.calc_factor(serial + "." + x, data[i][x], x);
							
							}
						}
					}
				}
/*	
				doStateCreate(serial + "._Last_Sync", "Zeitpunkt Letzte Syncronisierung", "number","value.time", "");
				adapter.setState(serial + "._Last_Sync", { val: data.time, ack: true });
	
				for (const x in data.values) {
	
					// Verify if JSON contains values which are implemented in Adapter, if yes proces values if not return error message
					// This must be improve in later version to handle outside of hard-coded and move to configuration file
					// Only power and voltage states will be run in "short" interval, all others less frequent (not needed and better)
					// Creation of new objects is limited to adapter start
					switch (x) {
						case "power":
	
							if (pulltype == "initialize") doStateCreate(serial + ".Power", "Momentanwert jetziger Bezug", "number", "value", "W");
							if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".Power", { val: data.values[x] / 1000, ack: true });
	
							// Seperate states for usage and delivery
							if (pulltype == "initialize" && data.values[x] > 0) doStateCreate(serial + ".Power_Usage", "Momentanwert jetzige Abnahme", "number",  "value", "W");
							if ((pulltype == "initialize" || pulltype == "short") && data.values[x] > 0) adapter.setState(serial + ".Power_Usage", { val: data.values[x] / 1000, ack: true });
							if (pulltype == "initialize" && data.values[x] < 0) doStateCreate(serial + ".Power_Delivery", "Momentanwert jetzige Abgabe", "number", "value", "W");
							if ((pulltype == "initialize" || pulltype == "short") && data.values[x] < 0) adapter.setState(serial + ".Power_Delivery", { val: data.values[x] / 1000, ack: true });
	
							break;
	
						case "power1":
	
							if (pulltype == "initialize") doStateCreate(serial + ".Power_1", "Momentanwert jetziger Bezug T1", "number",  "value", "W");
							if (pulltype == "initialize" || pulltype == "short")adapter.setState(serial + ".Power_1", { val: data.values[x] / 1000, ack: true });
							
							// Seperate states for usage and delivery
							if (pulltype == "initialize" && data.values[x] > 0) doStateCreate(serial + ".Power_1_Usage", "Momentanwert jetzige Abnahme T1", "number",  "value", "W");
							if ((pulltype == "initialize" || pulltype == "short") && data.values[x] > 0) adapter.setState(serial + ".Power_1_Usage", { val: data.values[x] / 1000, ack: true });
							if (pulltype == "initialize" && data.values[x] < 0) doStateCreate(serial + ".Power_1_Delivery", "Momentanwert jetzige Abgabe T1", "number",  "value", "W");
							if ((pulltype == "initialize" || pulltype == "short") && data.values[x] < 0) adapter.setState(serial + ".Power_1_Delivery", { val: data.values[x] / 1000, ack: true });
	
							break;
	
						case "power2":
	
							if (pulltype == "initialize") doStateCreate(serial + ".Power_2", "Momentanwert jetziger Bezug T2", "number",  "value", "W");
							if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".Power_2", { val: data.values[x] / 1000, ack: true });
							// Seperate states for usage and delivery						
							if (pulltype == "initialize" && data.values[x] > 0) doStateCreate(serial + ".Power_2_Usage", "Momentanwert jetzige Abnahme T2", "number",  "value", "W");
							if ((pulltype == "initialize" || pulltype == "short") && data.values[x] > 0) adapter.setState(serial + ".Power_2_Usage", { val: data.values[x] / 1000, ack: true });
							if (pulltype == "initialize" && data.values[x] < 0) doStateCreate(serial + ".Power_2_Delivery", "Momentanwert jetzige Abgabe T2", "number",  "value", "W");
							if ((pulltype == "initialize" || pulltype == "short") && data.values[x] < 0) adapter.setState(serial + ".Power_2_Delivery", { val: data.values[x] / 1000, ack: true });
							
							break;
	
						case "power3":
	
							if (pulltype == "initialize") doStateCreate(serial + ".Power_3", "Momentanwert jetziger Bezug T3", "number",  "value", "W");
							if (pulltype == "initialize" || pulltype == "short") adapter.setState(serial + ".Power_3", { val: data.values[x] / 1000, ack: true });
							// Seperate states for usage and delivery						
							if (pulltype == "initialize" && data.values[x] > 0) doStateCreate(serial + ".Power_3_Usage", "Momentanwert jetzige Abnahme T3", "number",  "value", "W");
							if ((pulltype == "initialize" || pulltype == "short") && data.values[x] > 0) adapter.setState(serial + ".Power_3_Usage", { val: data.values[x] / 1000, ack: true });
							if (pulltype == "initialize" && data.values[x] < 0) doStateCreate(serial + ".Power_3_Delivery", "Momentanwert jetzige Abgabe T3", "number",  "value", "W");
							if ((pulltype == "initialize" || pulltype == "short") && data.values[x] < 0) adapter.setState(serial + ".Power_3_Delivery", { val: data.values[x] / 1000, ack: true });
							break;
					}
				}

				*/

			} else { // error or non-200 status code
				this.log.error("Error retrieving information for : " + serial);
			}
		});
	}

	calc_factor (state, value, type){

		switch (type) {

			case "energy":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energy1":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energy2":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energy3":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energyOut":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energyOut1":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energyOut2":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energyOut3":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;	
			
			case "energyProducer8":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energyProducer9":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "energyProducer10":

				this.setState(state, {val: (value / 10000000000), ack: true});
				break;

			case "power":

				this.setState(state, {val: (value / 1000), ack: true});
				break;

			case "power1":

				this.setState(state, {val: (value / 1000), ack: true});
				break;

			case "power2":
				this.setState(state, {val: (value / 1000), ack: true});
				break;

			case "power3":
				this.setState(state, {val: (value / 1000), ack: true});
				break;
		
			case "voltage":

				this.setState(state, {val: (value / 1000), ack: true});
				break;

			case "voltage1":

				this.setState(state, {val: (value / 1000), ack: true});
				break;

			case "voltage2":
				this.setState(state, {val: (value / 1000), ack: true});
				break;

			case "voltage3":
				this.setState(state, {val: (value / 1000), ack: true});
				break;

			default:
				// this.log.error("Error in case handling of type identificaton : " + state);
				this.setState(state, {val: value, ack: true});
				return;
		}

	}

	// Function to decrypt passwords
	decrypt(key, value) {
		let result = "";
		for (let i = 0; i < value.length; ++i) {
			result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
		}
		this.log.debug("client_secret decrypt ready");
		return result;
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Discovergy(options);
} else {
	// otherwise start the instance directly
	new Discovergy();
}