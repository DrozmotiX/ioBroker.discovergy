const { expect } = require('chai');
const stateAttr = require('../lib/stateAttr');

describe('State Definitions', () => {
    it('should have submeter state defined', () => {
        expect(stateAttr).to.have.property('submeter');
        expect(stateAttr.submeter).to.have.property('name', 'Submeter Present');
        expect(stateAttr.submeter).to.have.property('type', 'boolean');
        expect(stateAttr.submeter).to.have.property('role', 'indicator');
    });

    it('should have kWhScalingFactor state defined', () => {
        expect(stateAttr).to.have.property('kWhScalingFactor');
        expect(stateAttr.kWhScalingFactor).to.have.property('name', 'kWh Scaling Factor');
        expect(stateAttr.kWhScalingFactor).to.have.property('type', 'number');
        expect(stateAttr.kWhScalingFactor).to.have.property('role', 'state');
    });

    it('should have all required energy states defined with correct factors', () => {
        const energyStates = ['energy', 'energy1', 'energy2', 'energy3', 'energyOut', 'energyOut1'];
        
        energyStates.forEach(state => {
            expect(stateAttr).to.have.property(state);
            expect(stateAttr[state]).to.have.property('factor', 10000000000);
            expect(stateAttr[state]).to.have.property('unit', 'kWh');
        });
    });
});
