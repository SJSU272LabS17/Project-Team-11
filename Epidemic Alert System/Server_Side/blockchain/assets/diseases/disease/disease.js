
var remove = require(__dirname+'/CRUD/delete.js');
exports.delete = remove.delete;

var read = require(__dirname+'/CRUD/read.js');
exports.read = read.read;


var medicinesFile = require(__dirname+'/type/type.js');
var medicines = {};
medicines.update = medicinesFile.update;
medicines.read = medicinesFile.read;
exports.medicines = medicines;

var nameFile = require(__dirname+'/diseasename/diseasename.js');
var diseasename = {};
diseasename.update = nameFile.update;
diseasename.read = nameFile.read;
exports.name = diseasename;

var zipcodeFile = require(__dirname+'/zipcode/zipcode.js');
var zipcode = {};
zipcode.update = zipcodeFile.update;
zipcode.read = zipcodeFile.read;
exports.zipcode = zipcode;

var symptomsFile = require(__dirname+'/symptoms/symptoms.js');
var symptoms = {};
symptoms.update = symptomsFile.update;
symptoms.read = symptomsFile.read;
exports.symptoms = symptoms;

var detectedFile = require(__dirname+'/detected/detected.js');
var detected = {};
detected.read = detectedFile.read;
exports.detected = detected;

var PINFile = require(__dirname+'/pin/pin.js');
var PIN = {};
PIN.update = PINFile.update;
PIN.read = PINFile.read;
exports.PIN = PIN;

var ownerFile = require(__dirname+'/owner/owner.js');
var owner = {};
owner.update = ownerFile.update;
owner.read = ownerFile.read;
exports.owner = owner;
