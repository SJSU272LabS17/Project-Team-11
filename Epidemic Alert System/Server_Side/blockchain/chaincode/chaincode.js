var diseasesFile = require(__dirname+'/diseases/diseases.js');
var diseases = {};
diseases.create = diseasesFile.create;
exports.diseases = diseases;
