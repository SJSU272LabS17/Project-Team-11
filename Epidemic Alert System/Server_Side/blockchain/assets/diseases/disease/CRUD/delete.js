'use strict';
let request = require('request');
let configFile = require(__dirname+'/../../../../../configurations/configuration.js');
let tracing = require(__dirname+'/../../../../../tools/traces/trace.js');
let map_ID = require(__dirname+'/../../../../../tools/map_ID/map_ID.js');
let Util = require(__dirname+'/../../../../../tools/utils/util');

let user_id;
let securityContext;
let user;

let update = function(req, res, next, usersToSecurityContext)
{
    if(typeof req.cookies.user !== 'undefined')
    {
        req.session.user = req.cookies.user;
        req.session.identity = map_ID.user_to_id(req.cookies.user);
    }

    user_id = req.session.identity;

    let diseaseID = req.params.diseaseID;

    tracing.create('ENTER', 'DELETE blockchain/assets/diseases/disease/'+diseaseID+'/detect', {});

    res.write('{"message":"Formatting request"}&&');

    let securityContext = usersToSecurityContext[user_id];

    return Util.invokeChaincode(securityContext, 'detect_disease', [ diseaseID ])
    .then(function(data) {
        tracing.create('INFO', 'DELETE blockchain/assets/diseases/disease/'+diseaseID+'/detect', 'Achieving consensus');
        res.write('{"message":"Achieving consensus"}&&');
        let result = {};
        result.message = 'detect updated';
        tracing.create('EXIT', 'DELETE blockchain/assets/diseases/disease/'+diseaseID+'/detect', result);
        res.end(JSON.stringify(result));
    })
    .catch(function(err) {
        res.status(400);
        tracing.create('ERROR', 'DELETE blockchain/assets/diseases/disease/'+diseaseID+'/detect', 'Unable to update detect. diseaseID: '+ diseaseID);
        let error = {};
        error.error = true;
        error.message = 'Unable to update detect. ' + err;
        error.diseaseID = diseaseID;
        tracing.create('ERROR', 'DELETE blockchain/assets/diseases/disease/'+diseaseID+'/detect', error);
        res.end(JSON.stringify(error));
    });
};
exports.delete = update;
