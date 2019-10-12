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
							this.doStateCreate(objArray[i]["serialNumber"] + ".info." + x,state_attr[x].name,state_attr[x].type,state_attr[x].role,state_attr[x].read,state_attr[x].unit,state_attr[x].write);
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
			const intervall = (this.config.pull_Short * 1000);
			setTimeout( () => {
				this.doDiscovergyMeter(username, password, endpoint, urlencoded_parameters, serial);
			}, intervall);

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
											this.doStateCreate(serial + ".Power_Consumption", "Momentanwert jetzige Abnahme", state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_Consumption", data[i][x], x);
											this.calc_factor(serial + ".Power_Delivery", data[i][x], 0);
										} else {
											this.doStateCreate(serial + ".Power_Delivery", "Momentanwert jetziger Abgabe", state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_Delivery", data[i][x], x);
											this.calc_factor(serial + ".Power_Consumption", data[i][x], 0);										
										}
	
										break;

									case "power1":
										if (data[i][x] > 0) {
											this.doStateCreate(serial + ".Power_T1_Consumption", "Momentanwert jetzige Abnahme T1", state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_T1_Consumption", data[i][x], x);
										} else {
											this.doStateCreate(serial + ".Power_T1_Delivery", "Momentanwert jetziger Abgabe T1", state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_T1_Delivery", data[i][x], x);										
										}

										break;
	
									case "power2":
										if (data[i][x] > 0) {
											this.doStateCreate(serial + ".Power_T2_Consumption", "Momentanwert jetzige Abnahme T2", state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_T2_Consumption", data[i][x], x);
										} else {
											this.doStateCreate(serial + ".Power_T2_Delivery", "Momentanwert jetziger Abgabe T2", state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_T2_Delivery", data[i][x], x);										
										}

										break;
	
									case "power3":
										if (data[i][x] > 0) {
											this.doStateCreate(serial + ".Power_T3_Consumption", "Momentanwert jetzige Abnahme T3", state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_T3_Consumption", data[i][x], x);
										} else {
											this.doStateCreate(serial + ".Power_T3_Delivery", "Momentanwert jetziger Abgabe T3", state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
											this.calc_factor(serial + ".Power_T3_Delivery", data[i][x], x);										
										}

										break;
	
									default:
	
										this.doStateCreate(serial + "." + x, state_attr[x].name, state_attr[x].type, state_attr[x].role, state_attr[x].read, state_attr[x].unit, state_attr[x].write);
										this.calc_factor(serial + "." + x, data[i][x], x);
	
								}
							}
						}
					}
				}

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