"use strict";
/*
 * Created with @iobroker/create-adapter v1.16.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = __importStar(require("@iobroker/adapter-core"));
const request_promise_native_1 = __importDefault(require("request-promise-native"));
const stateAttr_1 = __importDefault(require("./lib/stateAttr"));
const settings = { Username: "", Password: "", intervall: 30000 };
const warnMessages = {};
let timer = null;
class Discovergy extends utils.Adapter {
    constructor(options = {}) {
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
        this.setState('info.connection', false, true);
        this.log.info('Discovergy Adapter started, trying to discover meters associated with your account');
        // Check if credentials are not empty and decrypt stored password
        if (settings.Username !== '' && settings.Password !== '') {
            this.getForeignObject('system.config', async (_err, obj) => {
                if (obj && obj.native && obj.native.secret) {
                    //noinspection JSUnresolvedVariable
                    settings.Password = await this.decrypt(obj.native.secret, this.config.Password);
                }
                else {
                    //noinspection JSUnresolvedVariable
                    settings.Password = await this.decrypt('Zgfr56gFe87jJOM', this.config.Password);
                }
                // Adapter is alive, make API call
                await this.setForeignState('system.this.' + this.namespace + '.alive', false);
                // Make a call to discovergai API and get a list of all meters
                await this.doDiscovergyCall('meters', '');
            });
        }
        else {
            this.log.error('*** Adapter deactivated, credentials missing in Adaptper Settings !!!  ***');
            this.setForeignState('system.this.' + this.namespace + '.alive', false);
        }
    }
    // Get all meters connected to Discovergy account
    async doDiscovergyCall(endpoint, urlencoded_parameters) {
        const requestUrl = `https://${settings.Username}:${settings.Password}@api.discovergy.com/public/v1/${endpoint}?${urlencoded_parameters}`;
        //TODO: add try catch for failed api call
        await request_promise_native_1.default(requestUrl, async (error, response, body) => {
            if (!error && response.statusCode === 200) {
                // We got a response API is 
                this.setState('info.connection', true, true);
                // Retrieve all meter objects from Discovergy API
                const objArray = JSON.parse(body);
                this.log.debug(JSON.stringify(objArray));
                // Run truth array off all meter
                for (const meter of objArray) {
                    // Create device and info channel
                    this.log.debug(JSON.stringify(meter));
                    await this.createDeviceAsync(meter.serialNumber);
                    await this.createChannelAsync(meter['serialNumber'], 'info');
                    // Create info channel for alle meter devices
                    for (const [infoState, value] of Object.entries(meter)) {
                        if (!stateAttr_1.default[infoState]) {
                            this.log.error('State type : ' + infoState + ' unknown, send this information to the developer ==> ' + infoState + ' : ' + JSON.stringify(value));
                        }
                        else {
                            await this.doStateCreate(meter['serialNumber'] + '.info.' + infoState, infoState, value);
                        }
                    }
                    // Exclude RLM meters, no values to receive
                    if (meter['type'] !== 'RLM') {
                        this.allMeters[meter['meterId']] = meter;
                    }
                }
                this.log.info('All meters associated to your account discovered, initialise meters');
                this.log.debug('All meters : ' + JSON.stringify(this.allMeters));
                await this.dataPolling();
                this.log.info(`All meters initialized, polling data every ${this.config.intervall} seconds`);
            }
            else { // error or non-200 status code
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
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => {
            this.dataPolling();
        }, settings.intervall);
    }
    async doDiscovergyMeter(endpoint, _urlencoded_parameters, meterId) {
        try {
            const stateName = this.allMeters[meterId].serialNumber;
            const requestUrl = `https://${settings.Username}:${settings.Password}@api.discovergy.com/public/v1/${endpoint}?meterId=${meterId}`;
            await request_promise_native_1.default(requestUrl, async (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    // we got a response
                    const result = body;
                    const data = JSON.parse(result);
                    for (const attributes in data) {
                        for (const values in data[attributes]) {
                            if (stateAttr_1.default[values] === undefined) {
                                this.log.error(`State type : ${values} unknown, send this information to the developer ==> ${values} : ${JSON.stringify(data[attributes][values])}`);
                            }
                            else {
                                if (stateAttr_1.default[values].type !== undefined) {
                                    switch (values) {
                                        case 'power':
                                            if (data[attributes][values] > 0) {
                                                await this.doStateCreate(stateName + '.Power_Consumption', 'Power_Consumption', data[attributes][values]);
                                                this.doStateCreate(stateName + '.Power_Delivery', 'Power_Delivery', 0);
                                            }
                                            else {
                                                this.doStateCreate(stateName + '.Power_Delivery', 'Power_Delivery', Math.abs(data[attributes][values]));
                                                await this.doStateCreate(stateName + '.Power_Consumption', 'Power_Consumption', 0);
                                            }
                                            break;
                                        case 'power1':
                                            if (data[attributes][values] > 0) {
                                                await this.doStateCreate(stateName + '.Power_T1_Consumption', 'Power_T1_Consumption', data[attributes][values]);
                                                await this.doStateCreate(stateName + '.Power_T1_Delivery', 'Power_T1_Delivery', 0);
                                            }
                                            else {
                                                await this.doStateCreate(stateName + '.Power_T1_Delivery', 'Power_T1_Delivery', Math.abs(data[attributes][values]));
                                                await this.doStateCreate(stateName + '.Power_T1_Consumption', 'Power_T1_Consumption', 0);
                                            }
                                            break;
                                        case 'power2':
                                            if (data[attributes][values] > 0) {
                                                await this.doStateCreate(stateName + '.Power_T2_Consumption', 'Power_T2_Consumption', data[attributes][values]);
                                                await this.doStateCreate(stateName + '.Power_T2_Delivery', 'Power_T2_Delivery', 0);
                                            }
                                            else {
                                                await this.doStateCreate(stateName + '.Power_T2_Delivery', 'Power_T2_Delivery', Math.abs(data[attributes][values]));
                                                await this.doStateCreate(stateName + '.Power_T2_Consumption', 'Power_T2_Consumption', 0);
                                            }
                                            break;
                                        case 'power3':
                                            if (data[attributes][values] > 0) {
                                                await this.doStateCreate(stateName + '.Power_T3_Consumption', 'Power_T3_Consumption', data[attributes][values]);
                                                await this.doStateCreate(stateName + '.Power_T3_Delivery', 'Power_T3_Delivery', 0);
                                            }
                                            else {
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
                }
                else { // error or non-200 status code
                    this.log.error('Error retrieving information for : ' + meterId);
                }
            });
        }
        catch (error) {
            console.error(error);
        }
    }
    async doStateCreate(stateName, name, value) {
        // Strinfnify value if needed
        if (typeof (value) === 'object') {
            value = JSON.stringify(value);
        }
        const defCommon = stateAttr_1.default[name];
        // Try to get details from state lib, if not use defaults. throw warning if states is not known in attribute list
        if (!defCommon) {
            const warnMessage = `State attribute definition missing for + ${name}`;
            if (warnMessages[name] !== warnMessage) {
                warnMessages[name] = warnMessage;
                console.warn(warnMessage);
                this.log.warn(warnMessage);
                // Send information to Sentry
                this.sendSentry(warnMessage);
            }
        }
        const common = {
            name: defCommon !== undefined ? defCommon.name || name : name,
            type: typeof (value),
            role: defCommon !== undefined ? defCommon.role || 'state' : 'state',
            read: true,
            unit: defCommon !== undefined ? defCommon.unit || '' : '',
            write: defCommon !== undefined ? defCommon.write || false : false,
        };
        if ((!this.createdStatesDetails[stateName])
            || (this.createdStatesDetails[stateName]
                && (common.name !== this.createdStatesDetails[stateName].name
                    || common.name !== this.createdStatesDetails[stateName].name
                    || common.type !== this.createdStatesDetails[stateName].type
                    || common.role !== this.createdStatesDetails[stateName].role
                    || common.read !== this.createdStatesDetails[stateName].read
                    || common.unit !== this.createdStatesDetails[stateName].unit
                    || common.write !== this.createdStatesDetails[stateName].write))) {
            // console.log(`An attribute has changed : ${state}`);
            await this.extendObjectAsync(stateName, {
                type: 'state',
                common
            });
        }
        else {
            // console.log(`Nothing changed do not update object`);
        }
        // Store current object definition to memory
        this.createdStatesDetails[stateName] = common;
        // Handle calculation factor and set state
        if (!defCommon || !defCommon.factor) {
            this.setState(stateName, { val: value, ack: true });
        }
        else {
            const calcValue = value / defCommon.factor;
            this.setState(stateName, { val: calcValue, ack: true });
        }
    }
    // Function to decrypt passwords
    // @ts-expect-error
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
            if (timer)
                timer = null;
            callback();
        }
        catch (e) {
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
    module.exports = (options) => new Discovergy(options);
}
else {
    // otherwise start the instance directly
    new Discovergy();
}
//# sourceMappingURL=main.js.map