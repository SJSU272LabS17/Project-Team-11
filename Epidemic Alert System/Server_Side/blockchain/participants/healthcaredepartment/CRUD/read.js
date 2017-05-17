'use strict';

let tracing = require(__dirname+'/../../../../tools/traces/trace.js');
let participants = require(__dirname+'/../../participants_info.js');

let read = function(req, res)
{
    tracing.create('ENTER', 'GET blockchain/participants/healthcaredepartment', {});

    if(!participants.hasOwnProperty('healthcaredepartment'))
    {
        res.status(404);
        let error = {};
        error.message = 'Unable to retrieve healthcaredepartment';
        error.error = true;
        tracing.create('ERROR', 'GET blockchain/participants/healthcaredepartment', error);
        res.send(error);
    }
    else
    {
        tracing.create('EXIT', 'GET blockchain/participants/healthcaredepartment', {'result':participants.healthcaredepartments});
        res.send({'result':participants.healthcaredepartments});
    }

};
exports.read = read;
