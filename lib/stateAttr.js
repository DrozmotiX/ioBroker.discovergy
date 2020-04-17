// Classification of all state attributes possible
const stateAttrb = {
	'actualityDuration': {
		name: '< unknown >',
		type: 'number',
		role: 'state',
		unit: '',
	},
	'energy': {
		name: 'Zählerstand Bezug Gesamt',
		type: 'number',
		role: 'value.power.consumption',
		unit: 'kWh',
	},
	'energy1': {
		name: 'Zählerstand Bezug T1',
		type: 'number',
		role: 'value.power.consumption',
		unit: 'kWh',
	},
	'energy2': {
		name: 'Zählerstand Bezug T2',
		type: 'number',
		role: 'value.power.consumption',
		unit: 'kWh',
	},
	'energy3': {
		name: 'Zählerstand Bezug T3',
		type: 'number',
		role: 'value.power.consumption',
		unit: 'kWh',
	},
	'energyOut': {
		name: 'Zählerstand Abgabe Gesammt',
		type: 'number',
		role: 'value.power.delivery',
		unit: 'kWh',
	},
	'energyOut1': {
		name: 'Zählerstand Abgabe T1',
		type: 'number',
		role: 'value.power.delivery',
		unit: 'kWh',
	},
	'energyOut2': {
		name: 'Zählerstand Abgabe T2',
		type: 'number',
		role: 'value.power.delivery',
		unit: 'kWh',
	},
	'energyOut3': {
		name: 'Zählerstand Abgabe T3',
		type: 'number',
		role: 'value.power.delivery',
		unit: 'kWh',
	},
	'energyProducer8': {
		name: 'energy Producer',
		type: 'number',
		role: 'value.power.delivery',
		unit: 'kWh',
	},
	'energyProducer9': {
		name: 'energy Producer',
		type: 'number',
		role: 'value.power.delivery',
		unit: 'kWh',
	},
	'energyProducer10': {
		name: 'energy Producer',
		type: 'number',
		role: 'value.power.delivery',
		unit: 'kWh',
	},
	'serialNumber': {
		name: 'Serialnumber',
		type: 'number',
		role: 'state',
	},
	'lastMeasurementTime': {
		name: 'lastMeasurement Time',
		type: 'number',
		role: 'state',
	},
	'firstMeasurementTime': {
		name: 'firstMeasurementTime',
		type: 'number',
		role: 'state',
	},
	'internalMeters': {
		name: 'internal Meters',
		type: 'number',
		role: 'state',
	},
	'voltageScalingFactor': {
		name: 'voltage ScalingFactor',
		type: 'number',
		role: 'state',
	},
	'currentScalingFactor': {
		name: 'current ScalingFactor',
		type: 'number',
		role: 'state',
	},
	'scalingFactor': {
		name: 'scaling Factor',
		type: 'number',
		role: 'state',
	},
	'loadProfileType': {
		name: 'loadProfileType',
		type: 'mixed',
		role: 'state',
	},
	'measurementType': {
		name: 'measurementType',
		type: 'mixed',
		role: 'state',
	},
	'type': {
		name: 'type',
		type: 'mixed',
		role: 'state',
	},
	'administrationNumber': {
		name: 'administration Number',
		type: 'number',
		role: 'state',
	},
	'location': {
		name: 'location',
		type: 'array',
		role: 'state',
	},
	'fullSerialNumber': {
		name: 'full Serial Number',
		type: 'number',
		role: 'state',
	},
	'manufacturerId': {
		name: 'manufacturer Id',
		type: 'number',
		role: 'state',
	},
	'meterId': {
		name: 'meterId',
		type: 'number',
		role: 'state',
	},
	'power': {
		name: 'Power',
		type: 'number',
		role: 'value.power.consumption',
		unit: 'W',
	},
	'power1': {
		name: 'Power 1',
		type: 'number',
		role: 'value.power.consumption',
		unit: 'W',
	},
	'power2': {
		name: 'Power 2',
		type: 'number',
		role: 'value.power.consumption',
		unit: 'W',
	},
	'power3': {
		name: 'Power 3',
		type: 'number',
		role: 'value.power.consumption',
		unit: 'W',
	},
	'voltage': {
		name: 'Voltage',
		type: 'number',
		role: 'value.voltage',
		unit: 'V',
	},
	'voltage1': {
		name: 'Voltage',
		type: 'number',
		role: 'value.voltage',
		unit: 'V',
	},
	'voltage2': {
		name: 'Voltage',
		type: 'number',
		role: 'value.voltage',
		unit: 'V',
	},
	'voltage3': {
		name: 'Voltage',
		type: 'number',
		role: 'value.voltage',
		unit: 'V',
	},
	'volume': {
		name: 'Volume',
		type: 'number',
		role: 'state',
		unit: 'm3',
	},
};


module.exports = stateAttrb;