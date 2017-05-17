'use strict';
// let request = require('request');
// let configFile = require(__dirname+'/../../../../../configurations/configuration.js');
let tracing = require(__dirname+'/../../../../../tools/traces/trace.js');
let map_ID = require(__dirname+'/../../../../../tools/map_ID/map_ID.js');
let Util = require(__dirname+'/../../../../../tools/utils/util');

let user_id;
let securityContext;

let read = function (req,res,next,usersToSecurityContext)
{
    let diseaseID = req.params.diseaseID;

    tracing.create('ENTER', 'GET blockchain/assets/diseases/disease/'+diseaseID, {});
    if(typeof req.cookies.user != 'undefined')
    {
        req.session.user = req.cookies.user;
        req.session.identity = map_ID.user_to_id(req.cookies.user);
    }

    user_id = req.session.identity;
    securityContext = usersToSecurityContext[user_id];

    return Util.queryChaincode(securityContext, 'get_disease_details', [ diseaseID ])
    .then(function(data) {
        let car = JSON.parse(data.toString());
        let result = {};
        result.disease = car;
        tracing.create('EXIT', 'GET blockchain/assets/diseases/disease/'+diseaseID, result);
        res.send(result.disease);
    })
    .catch(function(err) {
        res.status(400);
        tracing.create('ERROR', 'GET blockchain/assets/diseases/disease/'+diseaseID, 'Unable to get disease. diseaseID: '+ diseaseID);
        let error = {};
        error.message = err;
        error.diseaseID = diseaseID;
        error.error = true;
        tracing.create('ERROR', 'GET blockchain/assets/diseases/disease/'+diseaseID, error);
        res.send(error);
    });
};

exports.read = read;
