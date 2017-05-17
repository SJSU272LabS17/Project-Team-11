'use strict';

let tracing = require(__dirname+'/../../../../tools/traces/trace.js');
let participants = require(__dirname+'/../../participants_info.js');

let read = function(req, res)
{
    tracing.create('ENTER', 'GET blockchain/participants/researchinstitutes', {});

    if(!participants.hasOwnProperty('researchinstitutes'))
	{
        res.status(404);
        let error = {};
        error.message = 'Unable to retrieve researchinstitutes';
        error.error = true;
        tracing.create('ERROR', 'GET blockchain/participants/researchinstitutes', error);
        res.send(error);
    }
    else
	{
        tracing.create('EXIT', 'GET blockchain/participants/researchinstitutes', {'result':participants.researchinstitutes});
        res.send({'result':participants.researchinstitutes});
    }
};
exports.read = read;
