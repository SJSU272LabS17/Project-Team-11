'use strict';
let tracing = require(__dirname+'/../../../../tools/traces/trace.js');
let map_ID = require(__dirname+'/../../../../tools/map_ID/map_ID.js');
let Util = require(__dirname+'/../../../../tools/utils/util');
let Disease = require(__dirname+'/../../../../tools/utils/disease.js');

function create (req, res, next, usersToSecurityContext) {
    let user_id;

    if(typeof req.cookies.user !== 'undefined')
    {
        req.session.user = req.cookies.user;
        req.session.identity = map_ID.user_to_id(req.cookies.user);
    }
    user_id = req.session.identity;
    
    //console.log("here usersToSecurityContext",user_id);

    let diseaseData = new Disease(usersToSecurityContext);
    

    return diseaseData.create(user_id)
   

    .then(function(diseaseID) {
	
        tracing.create('INFO', 'POST blockchain/assets/diseases', 'Created disease');
        let result = {};
        result.message = 'Creation Confirmed';
        result.diseaseID = diseaseID;
        res.end(JSON.stringify(result));
    })
    .catch(function(err) {
	// console.log("in catch diseaseID ",diseaseID);
        tracing.create('ERROR', 'POST blockchain/assets/diseases', err.stack);
        res.send(JSON.stringify({'message':err.stack}));
    });
}

exports.create = create;
