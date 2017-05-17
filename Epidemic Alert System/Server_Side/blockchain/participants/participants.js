/*eslint-env node */
var create = require(__dirname+'/CRUD/create.js');
exports.create = create.create;

var read = require(__dirname+'/CRUD/read.js');
exports.read = read.read;

var regulatorsFile = require(__dirname+'/regulators/regulators.js');
var regulators = {};
regulators.read = regulatorsFile.read;
exports.regulators = regulators;

var doctorsFile = require(__dirname+'/doctors/doctors.js');
var doctors = {};
doctors.read = doctorsFile.read;
exports.doctors = doctors;

var laboratoryFile = require(__dirname+'/laboratory/laboratory.js');
var laboratory = {};
laboratory.read = laboratoryFile.read;
exports.labs = laboratory;

var healthcaredepartmentFile = require(__dirname+'/healthCareDepartment/healthCareDepartment.js');
var healthcaredepartment = {};
healthcaredepartment.read = healthcaredepartmentFile.read;
exports.healthcaredepartment = healthcaredepartment;

var researchinstituteFile = require(__dirname+'/researchinstitute/researchinstitute.js');
var researchinstitute = {};
researchinstitute.read = researchinstituteFile.read;
exports.researchinstitute = researchinstitute;

var hospitalsFile = require(__dirname+'/hospitals/hospitals.js');
var hospitals = {};
hospitals.read = hospitalsFile.read;
exports.hospitals = hospitals;
