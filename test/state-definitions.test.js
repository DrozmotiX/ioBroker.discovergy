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

    // Test all states from issue #313
    describe('Issue #313 - Extended Inexogy API fields', () => {
        it('should have frequency state defined', () => {
            expect(stateAttr).to.have.property('frequency');
            expect(stateAttr.frequency).to.have.property('type', 'number');
            expect(stateAttr.frequency).to.have.property('unit', 'Hz');
        });

        it('should have all power factor states defined', () => {
            const powerFactorStates = ['powerFactor', 'phase1PowerFactor', 'phase2PowerFactor', 'phase3PowerFactor'];
            
            powerFactorStates.forEach(state => {
                expect(stateAttr).to.have.property(state);
                expect(stateAttr[state]).to.have.property('type', 'number');
                expect(stateAttr[state]).to.have.property('role', 'state');
            });
        });

        it('should have all apparent power states defined', () => {
            const apparentPowerStates = ['apparentPower', 'phase1ApparentPower', 'phase2ApparentPower', 'phase3ApparentPower'];
            
            apparentPowerStates.forEach(state => {
                expect(stateAttr).to.have.property(state);
                expect(stateAttr[state]).to.have.property('type', 'number');
                expect(stateAttr[state]).to.have.property('unit', 'VA');
                expect(stateAttr[state]).to.have.property('factor', 1000);
            });
        });

        it('should have all reactive power states defined', () => {
            const reactivePowerStates = ['reactivePower', 'phase1ReactivePower', 'phase2ReactivePower', 'phase3ReactivePower'];
            
            reactivePowerStates.forEach(state => {
                expect(stateAttr).to.have.property(state);
                expect(stateAttr[state]).to.have.property('type', 'number');
                expect(stateAttr[state]).to.have.property('unit', 'var');
                expect(stateAttr[state]).to.have.property('factor', 1000);
            });
        });

        it('should have all current states defined', () => {
            const currentStates = ['phase1Current', 'phase2Current', 'phase3Current'];
            
            currentStates.forEach(state => {
                expect(stateAttr).to.have.property(state);
                expect(stateAttr[state]).to.have.property('type', 'number');
                expect(stateAttr[state]).to.have.property('role', 'value.current');
                expect(stateAttr[state]).to.have.property('unit', 'A');
            });
        });

        it('should have energy4 and energyOut4 states defined', () => {
            expect(stateAttr).to.have.property('energy4');
            expect(stateAttr.energy4).to.have.property('unit', 'kWh');
            expect(stateAttr.energy4).to.have.property('factor', 10000000000);

            expect(stateAttr).to.have.property('energyOut4');
            expect(stateAttr.energyOut4).to.have.property('unit', 'kWh');
            expect(stateAttr.energyOut4).to.have.property('factor', 10000000000);
        });

        it('should have all reactive energy states defined', () => {
            const reactiveEnergyStates = [
                'reactiveEnergy', 'reactiveEnergy1', 'reactiveEnergy2', 'reactiveEnergy3', 'reactiveEnergy4',
                'reactiveEnergyOut', 'reactiveEnergyOut1', 'reactiveEnergyOut2', 'reactiveEnergyOut3', 'reactiveEnergyOut4'
            ];
            
            reactiveEnergyStates.forEach(state => {
                expect(stateAttr).to.have.property(state);
                expect(stateAttr[state]).to.have.property('type', 'number');
                expect(stateAttr[state]).to.have.property('unit', 'kvarh');
                expect(stateAttr[state]).to.have.property('factor', 10000000000);
            });
        });

        it('should have all capacitive reactive energy states defined', () => {
            const capacitiveStates = [
                'capacitiveReactiveEnergy', 'capacitiveReactiveEnergy1', 'capacitiveReactiveEnergy2', 
                'capacitiveReactiveEnergy3', 'capacitiveReactiveEnergy4',
                'capacitiveReactiveEnergyOut', 'capacitiveReactiveEnergyOut1', 'capacitiveReactiveEnergyOut2', 
                'capacitiveReactiveEnergyOut3', 'capacitiveReactiveEnergyOut4'
            ];
            
            capacitiveStates.forEach(state => {
                expect(stateAttr).to.have.property(state);
                expect(stateAttr[state]).to.have.property('type', 'number');
                expect(stateAttr[state]).to.have.property('unit', 'kvarh');
                expect(stateAttr[state]).to.have.property('factor', 10000000000);
            });
        });

        it('should have all inductive reactive energy states defined', () => {
            const inductiveStates = [
                'inductiveReactiveEnergy', 'inductiveReactiveEnergy1', 'inductiveReactiveEnergy2', 
                'inductiveReactiveEnergy3', 'inductiveReactiveEnergy4',
                'inductiveReactiveEnergyOut', 'inductiveReactiveEnergyOut1', 'inductiveReactiveEnergyOut2', 
                'inductiveReactiveEnergyOut3', 'inductiveReactiveEnergyOut4'
            ];
            
            inductiveStates.forEach(state => {
                expect(stateAttr).to.have.property(state);
                expect(stateAttr[state]).to.have.property('type', 'number');
                expect(stateAttr[state]).to.have.property('unit', 'kvarh');
                expect(stateAttr[state]).to.have.property('factor', 10000000000);
            });
        });
    });
});
