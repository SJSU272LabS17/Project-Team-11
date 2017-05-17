'use strict';

let tracing = require(__dirname+'/../../../../tools/traces/trace.js');
let participants = require(__dirname+'/../../participants_info.js');

let read = function(req, res)
{
    tracing.create('ENTER', 'GET blockchain/participants/doctors', {});

    if(!participants.hasOwnProperty('doctors'))
    {
        res.status(404);
        let error = {};
        error.message = 'Unable to retrieve doctors';
        error.error = true;
        tracing.create('ERROR', 'GET blockchain/participants/doctors', error);
        res.send(error);
    }
    else
    {
        tracing.create('EXIT', 'GET blockchain/participants/doctors', {'result':participants.doctors});
        res.send({'result':participants.doctors});
    }
};
exports.read = read;
