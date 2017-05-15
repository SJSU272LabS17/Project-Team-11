'use strict';

const hfc = require('hfc');
const Disease = require(__dirname+'/../../../tools/utils/disease');

let tracing = require(__dirname+'/../../../tools/traces/trace.js');
let map_ID = require(__dirname+'/../../../tools/map_ID/map_ID.js');
let initial_diseases = require(__dirname+'/../../../blockchain/assets/diseases/initial_diseases.js');
let fs = require('fs');

const TYPES = [
    'regulator_to_doctor',
    'doctor_to_laboratory',
    'laboratory_to_hospital',
    'hospital_to_healthdiseaseDepartment',
    'healthdiseaseDepartment_to_researchInstitute'
];

let diseaseData;
let diseaseIDResults;

function create(req, res, next, usersToSecurityContext) {
    try {
        diseaseIDResults = [];
        let chain = hfc.getChain('myChain');
        diseaseData = new Disease(usersToSecurityContext);

        let diseases;
        res.write(JSON.stringify({message:'Creating diseases'})+'&&');
        fs.writeFileSync(__dirname+'/../../../logs/demo_status.log', '{"logs": []}');

        tracing.create('ENTER', 'POST admin/demo', req.body);

        let scenario = req.body.scenario;

        if(scenario === 'simple' || scenario === 'full') {
            diseases = initial_diseases[scenario];
        } else {
            let error = {};
            error.message = 'Scenario type not recognised';
            error.error = true;
            res.end(JSON.stringify(error));
            return;
        }

        if(diseases.hasOwnProperty('disease')) {
            tracing.create('INFO', 'Demo', 'Found disease');
            diseases = diseases.diseases;
            updateDemoStatus({message: 'Creating diseases'});
            // chain.getEventHub().connect();
            return createDiseases(diseases)
            .then(function() {
                return diseaseIDResults.reduce(function(prev, diseaseID, index) {
                    let disease = diseases[index];
                    let patient = map_ID.user_to_id('DVLA');
                    let doctor = map_ID.user_to_id(disease.Owners[1]);
                    return prev.then(function() {
                        return transferDisease(diseaseID, patient, doctor, 'authority_to_manufacturer');
                    });
                }, Promise.resolve());
            })
            .then(function() {
                updateDemoStatus({message: 'Updating diseases'});
                return diseaseIDResults.reduce(function(prev, diseaseID, index){
                    let disease = diseases[index];
                    return prev.then(function() {
                        return populateDisease(diseaseID, disease);
                    });
                }, Promise.resolve());
            })
            .then(function() {
                updateDemoStatus({message: 'Transfering diseases between owners'});
                return diseaseIDResults.reduce(function(prev, diseaseID, index) {
                    let disease = diseases[index];
                    return prev.then(function() {
                        return transferBetweenOwners(diseaseID, disease);
                    });
                }, Promise.resolve());
            })
            .then(function() {
                updateDemoStatus({message: 'Demo setup'});
                // chain.getEventHub().disconnect();
                res.end(JSON.stringify({message: 'Demo setup'}));
            })
            .catch(function(err) {
                tracing.create('ERROR   DEMO', JSON.stringify(err), '');
                updateDemoStatus({message: JSON.stringify(err), error: true});
                tracing.create('ERROR', 'POST admin/demo', err.stack);
                // chain.getEventHub().disconnect();
                res.end(JSON.stringify(err));
            });
        } else {
            let error = {};
            error.message = 'Initial diseases not found';
            error.error = true;
            updateDemoStatus({message: JSON.stringify(error), error: true});
            res.end(JSON.stringify(error));
            return;
        }
    } catch (e) {
        console.log(e);
        res.end(JSON.stringify(e));
    }
}

function transferBetweenOwners(diseaseID, disease, results) {
    let functionName;
    let newdisease = JSON.parse(JSON.stringify(disease));
    if (!results) {
        results = [];
    }
    if (newdisease.Owners.length > 2) {
        let patient = map_ID.user_to_id(newdisease.Owners[1]); // First after DVLA
        let doctor = map_ID.user_to_id(newdisease.Owners[2]); // Second after DVLA
        functionName = TYPES[results.length + 1];
        return transferDisease(diseaseID, patient, doctor, functionName)
        .then(function(result) {
            console.log('[#] Transfer disease ' + diseaseID + ' between ' + patient + ' -> ' + doctor);
            results.push(result);
            newdisease.Owners.shift();
            return transferBetweenOwners(diseaseID, newdisease, results);
        })
        .catch((err) => {
            console.log('[X] Unable to transfer disease', err);
        });
    } else {
        return Promise.resolve(results);
    }
}

function createDiseases(diseases) {
    return diseases.reduce(function(prev, disease, index) {
        return prev.then(function() {
            return createDisease()
            .then(function(result) {
                diseaseIDResults.push(result);
            });
        });
    }, Promise.resolve());
}

function createDisease() {
    console.log('[#] Creating Disease');
    return diseaseData.create('DVLA');
}

function populateDiseaseProperty(diseaseID, ownerId, propertyName, propertyValue) {
    let normalisedPropertyName = propertyName.toLowerCase();
    return diseaseData.updateAttribute(ownerId, 'update_'+normalisedPropertyName, propertyValue, diseaseID);
}

function populateDisease(diseaseID, disease) {
    console.log('[#] Populating disease');
    let result = Promise.resolve();
    for(let propertyName in disease) {
        let normalisedPropertyName = propertyName.toLowerCase();
        let propertyValue = disease[propertyName];
        if (propertyName !== 'Owners') {
            result = result.then(function() {
                return populateDiseaseProperty(diseaseID, map_ID.user_to_id(disease.Owners[1]), normalisedPropertyName, propertyValue);
            });
        }
    }
    return result;
}

function transferDisease(diseaseID, patient, doctor, functionName) {
    console.log('[#] Transfering Disease to ' + doctor);
    return diseaseData.transfer(patient, doctor, functionName, diseaseID);
}

function updateDemoStatus(status) {
    try {
        let statusFile = fs.readFileSync(__dirname+'/../../../logs/demo_status.log');
        let demoStatus = JSON.parse(statusFile);
        demoStatus.logs.push(status);
        fs.writeFileSync(__dirname+'/../../../logs/demo_status.log', JSON.stringify(demoStatus));

        if(!status.hasOwnProperty('error')) {
            if(status.message === 'Demo setup') {
                tracing.create('EXIT', 'POST admin/demo', status);
            } else {
                tracing.create('INFO', 'POST admin/demo', status.message);
            }
        } else {
            tracing.create('ERROR', 'POST admin/demo', status);
        }
    } catch (e) {
        console.log(e);
    }
}

exports.create = create;
