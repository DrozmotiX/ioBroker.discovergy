// Classification of all state attributes possible
const state_attrb = {
    "actualityDuration" : {
        name: '< unknown >',
        type: 'number',
        role: 'state',
        unit: '',
    },
    "energy" : {
        name: 'Zählerstand Bezug Gesamt',
        type: 'number',
        role: 'value.power.consumption',
        unit: 'kWh',
    },
    "energy1" : {
        name: 'Zählerstand Bezug T1',
        type: 'number',
        role: 'value.power.consumption',
        unit: 'kWh',
    },
    "energy2" : {
        name: 'Zählerstand Bezug T2',
        type: 'number',
        role: 'value.power.consumption',
        unit: 'kWh',
    },
    "energy3" : {
        name: 'Zählerstand Bezug T3',
        type: 'number',
        role: 'value.power.consumption',
        unit: 'kWh',
    },
    "energyOut" : {
        name: 'Zählerstand Abgabe Gesammt',
        type: 'number',
        role: 'value.power.delivery',
        unit: 'kWh',
    },
    "energyOut1" : {
        name: 'Zählerstand Abgabe T1',
        type: 'number',
        role: 'value.power.delivery',
        unit: 'kWh',
    },
    "energyOut2" : {
        name: 'Zählerstand Abgabe T2',
        type: 'number',
        role: 'value.power.delivery',
        unit: 'kWh',
    },
    "energyOut3" : {
        name: 'Zählerstand Abgabe T3',
        type: 'number',
        role: 'value.power.delivery',
        unit: 'kWh',
    },
    "energyProducer8" : {
        name: 'energy Producer',
        type: 'number',
        role: 'value.power.delivery',
        unit: 'kWh',
    },
    "energyProducer9" : {
        name: 'energy Producer',
        type: 'number',
        role: 'value.power.delivery',
        unit: 'kWh',
    },
    "energyProducer10" : {
        name: 'energy Producer',
        type: 'number',
        role: 'value.power.delivery',
        unit: 'kWh',
    }, 
    "serialNumber" : {
        type: 'number',
        role: 'state',
    },
    "lastMeasurementTime" : {
        type: 'number',
        role: 'state',
    },
    "firstMeasurementTime" : {
        type: 'number',
        role: 'state',
    },
    "internalMeters" : {
        type: 'number',
        role: 'state',
    },
    "voltageScalingFactor" : {
        type: 'number',
        role: 'state',
    },
    "currentScalingFactor" : {
        type: 'number',
        role: 'state',
    },
    "scalingFactor" : {
        type: 'number',
        role: 'state',
    },
    "loadProfileType" : {
        type: 'mixed',
        role: 'state',
    },
    "measurementType" : {
        type: 'mixed',
        role: 'state',
    },
    "type" : {
        type: 'mixed',
        role: 'state',
    },
    "administrationNumber" : {
        type: 'number',
        role: 'state',
    },
    "location" : {
        type: 'array',
        role: 'state',
    },
    "fullSerialNumber" : {
        type: 'number',
        role: 'state',
    },
    "manufacturerId" : {
        type: 'number',
        role: 'state',
    },
    "meterId" : {
        type: 'number',
        role: 'state',
    },
    "power" : {
        type: 'number',
        role: 'value.power.consumption',
        unit: 'W',
    },
    "power1" : {
        type: 'number',
        role: 'value.power.consumption',
        unit: 'W',
    },  
    "power2" : {
        type: 'number',
        role: 'value.power.consumption',
        unit: 'W',
    },
    "power3" : {
        type: 'number',
        role: 'value.power.consumption',
        unit: 'W',
    },
    "voltage" : {
        name: 'Voltage',
        type: 'number',
        role: 'value.voltage',
        unit: 'V',
    },
    "voltage1" : {
        name: 'Voltage',
        type: 'number',
        role: 'value.voltage',
        unit: 'V',
    },
    "voltage2" : {
        name: 'Voltage',
        type: 'number',
        role: 'value.voltage',
        unit: 'V',
    },
    "voltage3" : {
        name: 'Voltage',
        type: 'number',
        role: 'value.voltage',
        unit: 'V',
    },
    "volume" : {
        name: 'Volume',
        type: 'number',
        role: 'state',
        unit: 'm3',
    },         
}


module.exports = state_attrb;