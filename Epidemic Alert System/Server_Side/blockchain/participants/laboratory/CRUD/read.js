'use strict';

let tracing = require(__dirname+'/../../../../tools/traces/trace.js');
let participants = require(__dirname+'/../../participants_info.js');

let read = function(req, res)
{
    tracing.create('ENTER', 'GET blockchain/participants/laboratory', {});

    if(!participants.hasOwnProperty('laboratory'))
	{
        res.status(404);
        let error = {};
        error.message = 'Unable to retrieve laboratory';
        error.error = true;
        tracing.create('ERROR', 'GET blockchain/participants/laboratory', error);
        res.send(error);
    }
    else
	{
        tracing.create('EXIT', 'GET blockchain/participants/laboratory', {'result':participants.laboratory});
        res.send({'result':participants.laboratory});
    }
};
exports.read = read;
