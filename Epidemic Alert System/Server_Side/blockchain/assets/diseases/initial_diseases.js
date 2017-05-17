'use strict';
let simple_scenario = {
    'disease': [
        {
            'PIN': '287427561447767',
            'ZipCode': '95112',
            'Symptoms': 'headache,fever,vomiting',
            'Medicines': 'Crocin',
            'DiseaseName': 'Diarrhea',
            'Owners': ['DVLA', 'Mathew', 'Carson']
        },
        {
            'PIN': '549523556951325',
            'ZipCode': '95117',
            'Symptoms': 'chills, fatigue, fever',
            'Medicines': 'Paracetamol',
            'DiseaseName': 'Dengue',
            'Owners': ['DVLA', 'Jaguar Land Rover', 'Mathew']
        },
        {
            'PIN': '880352730316924',
            'ZipCode': '95118',
            'Symptoms': 'red spots,rashes, vomiting',
            'Medicines': 'Emetrol',
            'DiseaseName': 'unknown',
            'Owners': ['DVLA', '95118']
        }
    ]
};

let full_scenario = {
    'diseases': [
        {
            'PIN': '720965981630055',
            'ZipCode': '95112',
            'Symptoms': 'headache,fever,vomiting',
            'Medicines': 'Crocin',
            'DiseaseName': 'Diarrhea',
            'Owners': ['DVLA', 'Batra', 'Mathew', 'Carson', 'Joe Payne']
        },
        {
            'PIN': '287437467447767',
            'ZipCode': '95117',
            'Symptoms': 'chills, fatigue, fever',
            'Medicines': 'Paracetamol',
            'DiseaseName': 'Dengue',
            'Owners': ['DVLA', 'Batra', 'Mathew', 'Carson']
        },
        {
            'PIN': '948881310167423',
            'ZipCode': '95118',
            'Symptoms': 'red spot, rashes',
            'Medicines': 'citrezene',
            'DiseaseName': 'unknown',
            'Owners': ['DVLA', 'Batra', 'Mathew']
        },
     ]
};


exports.simple = simple_scenario;
exports.full = full_scenario;
