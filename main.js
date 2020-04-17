/* eslint-disable quotes */
'use strict';

/*
 * Created with @iobroker/create-adapter v1.16.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const request = require('request-promise-native');
const stateAttr = require(__dirname + '/lib/stateAttr.js');
const settings = { Username: "", Password: "", intervall: 30000 }, warnMessages = {};
let timer = null;

class Discovergy extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		// @ts-ignore
		super({
			...options,
			name: 'discovergy',
		});
		this.allMeters = {};
		this.createdStatesDetails = {};
		this.on('ready', this.onReady.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		settings.Username = this.config.Username;
		settings.Password = this.config.Password;
		settings.intervall = (1000 * this.config.intervall);
		await this.setState('info.connection', false, true);
		this.log.info('Discovergy Adapter startet, trying to discover meters associated with your account');
		// Check if credentials are not empty and decrypt stored password
		if (settings.user !== '' && settings.Password !== '') {
			this.getForeignObject('system.config', async (err, obj) => {
				if (obj && obj.native && obj.native.secret) {
					//noinspection JSUnresolvedVariable
					settings.Password = await this.decrypt(obj.native.secret, this.config.Password);
				} else {
					//noinspection JSUnresolvedVariable
					settings.Password = await this.decrypt('Zgfr56gFe87jJOM', this.config.Password);
				}
				// Adapter is alive, make API call
				await this.setForeignState('system.this.' + this.namespace + '.alive', false);

				// Make a call to discovergai API and get a list of all meters
				await this.doDiscovergyCall('meters', '');

			});
		} else {
			this.log.error('*** Adapter deactivated, credentials missing in Adaptper Settings !!!  ***');
			this.setForeignState('system.this.' + this.namespace + '.alive', false);
		}
	}

	// Get all meters connected to Discovergy account
	async doDiscovergyCall(endpoint, urlencoded_parameters) {

		const requestUrl = `https://${settings.Username}:${settings.Password}@api.discovergy.com/public/v1/${endpoint}?${urlencoded_parameters}`;
		await request(requestUrl, async (error, response, body) => {

			if (!error && response.statusCode === 200) {
				// We got a response API is 
				await this.setState('info.connection', true, true);

				// Retrieve all meter objects from Discovergy API
				/** @type {Record<string, any>[]} */
				const objArray = JSON.parse(body);
				this.log.debug(JSON.stringify(objArray));

				// Run truth array off all meter

				for (const meters of Object.keys(objArray)) {

					// Create device and info channel
					this.log.debug(JSON.stringify(objArray[meters]));
					await this.createDevice(objArray[meters]['meterId']);
					await this.createChannel(objArray[meters]['meterId'], 'info');

					// Create info channel for alle meter devices
					for (const infoState in objArray[meters]) {

						if (!stateAttr[infoState]) {
							this.log.error('State type : ' + infoState + ' unknown, send this information to the developer ==> ' + infoState + ' : ' + JSON.stringify(objArray[meters][infoState]));
						} else {
							await this.doStateCreate(objArray[meters]['meterId'] + '.info.' + infoState, stateAttr[infoState].name, stateAttr[infoState].type, stateAttr[infoState].role, stateAttr[infoState].read, stateAttr[infoState].unit, stateAttr[infoState].write);
							await this.setState(objArray[meters]['meterId'] + '.info.' + infoState, objArray[meters][infoState], true);
						}
					}

					// Exclude RLM meters, no values to receive
					if (objArray[meters]['type'] !== 'RLM') {

						this.allMeters[objArray[meters]['serialNumber']] = objArray[meters];
					}

				}

				this.log.info('All meters associated to your account discovered, initialise meters');
				this.log.debug('All meters : ' + JSON.stringify(this.allMeters));

				await this.dataPolling();

				this.log.info(`All meters initialized, polling data every ${this.config.intervall} seconds`);

			} else { // error or non-200 status code
				this.log.error('Connection_Failed at meter indication run, check your credentials !');
				this.setState('info.connection', false, true);
			}
		});
	}

	// Data polling timer, get read values for every meter (Last reading)
	async dataPolling() {

		// Loop on all meter and get data
		for (const serial in this.allMeters) {

			await this.doDiscovergyMeter(`last_reading`, serial, this.allMeters[serial].meterId);

		}

		// New data polling at intervall time
		if (timer) timer = null;
		timer = setTimeout(() => {
			this.dataPolling();
		}, settings.intervall);

	}

	async doDiscovergyMeter(endpoint, urlencoded_parameters, serial) {
		try {

			const requestUrl = `https://${settings.Username}:${settings.Password}@api.discovergy.com/public/v1/${endpoint}?meterId=${serial}`;
			await request(requestUrl, async (error, response, body) => {

				if (!error && response.statusCode === 200) {
					// we got a response

					const result = body;
					const data = JSON.parse(result);

					for (const i in data) {

						for (const x in data[i]) {

							if (stateAttr[x] === undefined) {
								this.log.error('State type : ' + x + ' unknown, send this information to the developer ==> ' + x + ' : ' + JSON.stringify(data[i][x]));
							} else {

								if (stateAttr[x].type !== undefined) {

									switch (x) {
										case 'power':
											if (data[i][x] > 0) {
												await this.doStateCreate(serial + '.Power_Consumption', 'Momentanwert jetzige Abnahme', stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
												this.calc_factor(serial + '.Power_Consumption', data[i][x], x);
												this.calc_factor(serial + '.Power_Delivery', 0, x);
											} else {
												this.doStateCreate(serial + '.Power_Delivery', 'Momentanwert jetziger Abgabe', stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
												this.calc_factor(serial + '.Power_Delivery', Math.abs(data[i][x]), x);
												this.calc_factor(serial + '.Power_Consumption', 0, x);
											}

											break;

										case 'power1':
											if (data[i][x] > 0) {
												await this.doStateCreate(serial + '.Power_T1_Consumption', 'Momentanwert jetzige Abnahme T1', stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
												this.calc_factor(serial + '.Power_T1_Consumption', data[i][x], x);
												this.calc_factor(serial + '.Power_T1_Delivery', 0, x);
											} else {
												await this.doStateCreate(serial + '.Power_T1_Delivery', 'Momentanwert jetziger Abgabe T1', stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
												this.calc_factor(serial + '.Power_T1_Delivery', Math.abs(data[i][x]), x);
												this.calc_factor(serial + '.Power_T1_Consumption', 0, x);
											}

											break;

										case 'power2':
											if (data[i][x] > 0) {
												await this.doStateCreate(serial + '.Power_T2_Consumption', 'Momentanwert jetzige Abnahme T2', stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
												this.calc_factor(serial + '.Power_T2_Consumption', data[i][x], x);
												this.calc_factor(serial + '.Power_T2_Delivery', 0, x);
											} else {
												await this.doStateCreate(serial + '.Power_T2_Delivery', 'Momentanwert jetziger Abgabe T2', stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
												this.calc_factor(serial + '.Power_T2_Delivery', Math.abs(data[i][x]), x);
												this.calc_factor(serial + '.Power_T2_Consumption', 0, x);
											}

											break;

										case 'power3':
											if (data[i][x] > 0) {
												await this.doStateCreate(serial + '.Power_T3_Consumption', 'Momentanwert jetzige Abnahme T3', stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
												this.calc_factor(serial + '.Power_T3_Consumption', data[i][x], x);
												this.calc_factor(serial + '.Power_T3_Delivery', 0, x);
											} else {
												await this.doStateCreate(serial + '.Power_T3_Delivery', 'Momentanwert jetziger Abgabe T3', stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
												this.calc_factor(serial + '.Power_T3_Delivery', Math.abs(data[i][x]), x);
												this.calc_factor(serial + '.Power_T3_Consumption', 0, x);
											}

											break;

										default:

											await this.doStateCreate(serial + '.' + x, stateAttr[x].name, stateAttr[x].type, stateAttr[x].role, stateAttr[x].read, stateAttr[x].unit, stateAttr[x].write);
											this.calc_factor(serial + '.' + x, data[i][x], x);

									}
								}
							}
						}
					}

				} else { // error or non-200 status code
					this.log.error('Error retrieving information for : ' + serial);
				}
			});
		} catch (error) {
			console.error(error);
		}
	}

	async doStateCreate(state, name, type, role, read, unit, write) {

		const common = {
			name: name,
			type: type,
			role: role,
			read: true,
			unit: unit,
			write: write,
		};

		if ((!this.createdStatesDetails[state])
			|| (this.createdStatesDetails[state]
				&& (
					common.name !== this.createdStatesDetails[state].name
					|| common.name !== this.createdStatesDetails[state].name
					|| common.type !== this.createdStatesDetails[state].type
					|| common.role !== this.createdStatesDetails[state].role
					|| common.read !== this.createdStatesDetails[state].read
					|| common.unit !== this.createdStatesDetails[state].unit
					|| common.write !== this.createdStatesDetails[state].write
				)
			)) {

			console.log(`An attribute has changed : ${state}`);

			await this.extendObjectAsync(state, {
				type: 'state',
				common
			});
		} else {
			console.log(`Nothing changed do not update object`);
		}

		// Store current object definition to memory
		this.createdStatesDetails[state] = common;
		
	}

	calc_factor(state, value, type) {

		switch (type) {

			case 'energy':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energy1':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energy2':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energy3':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energyOut':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energyOut1':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energyOut2':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energyOut3':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energyProducer8':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energyProducer9':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'energyProducer10':

				this.setState(state, { val: (value / 10000000000), ack: true });
				break;

			case 'power':

				this.setState(state, { val: (value / 1000), ack: true });
				break;

			case 'power1':

				this.setState(state, { val: (value / 1000), ack: true });
				break;

			case 'power2':
				this.setState(state, { val: (value / 1000), ack: true });
				break;

			case 'power3':
				this.setState(state, { val: (value / 1000), ack: true });
				break;

			case 'voltage':

				this.setState(state, { val: (value / 1000), ack: true });
				break;

			case 'voltage1':

				this.setState(state, { val: (value / 1000), ack: true });
				break;

			case 'voltage2':
				this.setState(state, { val: (value / 1000), ack: true });
				break;

			case 'voltage3':
				this.setState(state, { val: (value / 1000), ack: true });
				break;

			default:
				// this.log.error('Error in case handling of type identificaton : ' + state);
				this.setState(state, { val: value, ack: true });
				return;
		}

	}

	// Function to decrypt passwords
	decrypt(key, value) {
		let result = '';
		for (let i = 0; i < value.length; ++i) {
			result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
		}
		this.log.debug('client_secret decrypt ready');
		return result;
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info('cleaned everything up...');
			if (timer) timer = null;
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