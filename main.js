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

		// Load user settings
		settings.Username = this.config.Username;
		settings.Password = this.config.Password;
		settings.intervall = (1000 * this.config.intervall);

		await this.setState('info.connection', false, true);

		this.log.info('Discovergy Adapter startet, trying to discover meters associated with your account');

		//ToDo: Change to lib
		// Check if credentials are not empty and decrypt stored password
		if (settings.user !== '' && settings.Password !== '') {

			// Make a call to Discovergy API and get a list of all meters
			await this.doDiscovergyCall('meters', '');

			// });
		} else {
			this.log.error('*** Adapter deactivated, credentials missing in Adaptper Settings !!!  ***');
			this.setForeignState('system.this.' + this.namespace + '.alive', false);
		}
	}

	// Get all meters connected to Discovergy account
	async doDiscovergyCall(endpoint, urlencoded_parameters) {

		const requestUrl = `https://${settings.Username}:${settings.Password}@api.discovergy.com/public/v1/${endpoint}?${urlencoded_parameters}`;

		try {
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
						await this.createDevice(objArray[meters]['serialNumber']);
						await this.createChannel(objArray[meters]['serialNumber'], 'info');

						// Create info channel for alle meter devices
						for (const infoState in objArray[meters]) {

							if (!stateAttr[infoState]) {
								this.log.error('State type : ' + infoState + ' unknown, send this information to the developer ==> ' + infoState + ' : ' + JSON.stringify(objArray[meters][infoState]));
							} else {
								await this.doStateCreate(objArray[meters]['serialNumber'] + '.info.' + infoState, infoState, objArray[meters][infoState]);
							}
						}

						// Exclude RLM meters, no values to receive
						if (objArray[meters]['type'] !== 'RLM') {

							this.allMeters[objArray[meters]['meterId']] = objArray[meters];
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
		} catch (e) {
			this.log.error(`[doDiscovergyCall] ${e}`);
		}

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

	async doDiscovergyMeter(endpoint, urlencoded_parameters, meterId) {
		try {
			const stateName = this.allMeters[meterId].serialNumber;
			const requestUrl = `https://${settings.Username}:${settings.Password}@api.discovergy.com/public/v1/${endpoint}?meterId=${meterId}`;
			await request(requestUrl, async (error, response, body) => {

				if (!error && response.statusCode === 200) {
					// we got a response

					const result = body;
					const data = JSON.parse(result);

					for (const attributes in data) {

						for (const values in data[attributes]) {

							if (stateAttr[values] === undefined) {
								this.log.error(`State type : ${values} unknown, send this information to the developer ==> ${values} : ${JSON.stringify(data[attributes][values])}`);
							} else {

								if (stateAttr[values].type !== undefined) {

									switch (values) {
										case 'power':
											if (data[attributes][values] > 0) {
												await this.doStateCreate(stateName + '.Power_Consumption', 'Power_Consumption', data[attributes][values]);
												this.doStateCreate(stateName + '.Power_Delivery', 'Power_Delivery', 0);
											} else {
												this.doStateCreate(stateName + '.Power_Delivery', 'Power_Delivery', Math.abs(data[attributes][values]));
												await this.doStateCreate(stateName + '.Power_Consumption', 'Power_Consumption', 0);
											}

											break;

										case 'power1':
											if (data[attributes][values] > 0) {
												await this.doStateCreate(stateName + '.Power_T1_Consumption', 'Power_T1_Consumption', data[attributes][values]);
												await this.doStateCreate(stateName + '.Power_T1_Delivery', 'Power_T1_Delivery', 0);
											} else {
												await this.doStateCreate(stateName + '.Power_T1_Delivery', 'Power_T1_Delivery', Math.abs(data[attributes][values]));
												await this.doStateCreate(stateName + '.Power_T1_Consumption', 'Power_T1_Consumption', 0);
											}

											break;

										case 'power2':
											if (data[attributes][values] > 0) {
												await this.doStateCreate(stateName + '.Power_T2_Consumption', 'Power_T2_Consumption', data[attributes][values]);
												await this.doStateCreate(stateName + '.Power_T2_Delivery', 'Power_T2_Delivery', 0);
											} else {
												await this.doStateCreate(stateName + '.Power_T2_Delivery', 'Power_T2_Delivery', Math.abs(data[attributes][values]));
												await this.doStateCreate(stateName + '.Power_T2_Consumption', 'Power_T2_Consumption', 0);
											}

											break;

										case 'power3':
											if (data[attributes][values] > 0) {
												await this.doStateCreate(stateName + '.Power_T3_Consumption', 'Power_T3_Consumption', data[attributes][values]);
												await this.doStateCreate(stateName + '.Power_T3_Delivery', 'Power_T3_Delivery', 0);
											} else {
												await this.doStateCreate(stateName + '.Power_T3_Delivery', 'Power_T3_Delivery', Math.abs(data[attributes][values]));
												await this.doStateCreate(stateName + '.Power_T3_Consumption', 'Power_T3_Consumption', 0);
											}

											break;

										default:

											await this.doStateCreate(stateName + '.' + values, values, data[attributes][values]);

									}
								}
							}
						}
					}

				} else { // error or non-200 status code
					this.log.error('Error retrieving information for : ' + meterId);
				}
			});
		} catch (error) {
			console.error(error);
		}
	}

	async doStateCreate(stateName, name, value) {

		// Strinfnify value if needed

		if (typeof(value) === 'object') { value = JSON.stringify(value);}

		// Try to get details from state lib, if not use defaults. throw warning if states is not known in attribute list
		const common = {};
		if (!stateAttr[name]) {
			const warnMessage = `State attribute definition missing for + ${name}`;
			if (warnMessages[name] !== warnMessage) {
				warnMessages[name] = warnMessage;
				console.warn(warnMessage);
				this.log.warn(warnMessage);

				// Send information to Sentry
				this.sendSentry(warnMessage);
			}
		}

		common.name = stateAttr[name] !== undefined ? stateAttr[name].name || name : name;
		common.type = typeof(value);
		common.role = stateAttr[name] !== undefined ? stateAttr[name].role || 'state' : 'state';
		common.read = true;
		common.unit = stateAttr[name] !== undefined ? stateAttr[name].unit || '' : '';
		common.write = stateAttr[name] !== undefined ? stateAttr[name].write || false : false;

		if ((!this.createdStatesDetails[stateName])
			|| (this.createdStatesDetails[stateName]
				&& (
					common.name !== this.createdStatesDetails[stateName].name
					|| common.name !== this.createdStatesDetails[stateName].name
					|| common.type !== this.createdStatesDetails[stateName].type
					|| common.role !== this.createdStatesDetails[stateName].role
					|| common.read !== this.createdStatesDetails[stateName].read
					|| common.unit !== this.createdStatesDetails[stateName].unit
					|| common.write !== this.createdStatesDetails[stateName].write
				)
			)) {

			// console.log(`An attribute has changed : ${state}`);

			await this.extendObjectAsync(stateName, {
				type: 'state',
				common
			});

		} else {
			// console.log(`Nothing changed do not update object`);
		}

		// Store current object definition to memory
		this.createdStatesDetails[stateName] = common;

		// Handle calculation factor and set state
		if (!stateAttr[name] || !stateAttr[name].factor) {
			this.setState(stateName, { val: value, ack: true });
		} else {
			const calcValue = value / stateAttr[name].factor;
			this.setState(stateName, { val: calcValue, ack: true });
		}
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

	async sendSentry(msg) {
		this.log.info(`[Error catched and send to Sentry, thank you collaborating!] error: ${msg}`);
		if (this.supportsFeature && this.supportsFeature('PLUGINS')) {
			const sentryInstance = this.getPluginInstance('sentry');
			if (sentryInstance) {
				sentryInstance.getSentryObject().captureException(msg);
			}
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