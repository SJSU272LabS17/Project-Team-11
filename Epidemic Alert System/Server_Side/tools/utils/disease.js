'use strict';

const Util = require('./util.js');
const hfc = require('hfc');

class Disease {

    constructor(usersToSecurityContext) {

	
        this.usersToSecurityContext = usersToSecurityContext;
        this.chain = hfc.getChain('myChain'); //TODO: Make this a config param?
    }

    create(userId) {
	

        let securityContext = this.usersToSecurityContext[userId];
        let diseaseID = Disease.newdiseaseID();
	
	//console.log("UUIYIUUYUYUSS ",this.doesdiseaseIDExist(userId, diseaseID));

        return this.doesdiseaseIDExist(userId, diseaseID)
        .then(function() {
            return Util.invokeChaincode(securityContext, 'create_disease', [ diseaseID ])
            .then(function() {
		//console.log("diseaseID ",diseaseID);
                return diseaseID;
            });
        });
    }

    transfer(userId, buyer, functionName, diseaseID) {
        return this.updateAttribute(userId, functionName , buyer, diseaseID);
    }

    updateAttribute(userId, functionName, value, diseaseID) {
        let securityContext = this.usersToSecurityContext[userId];
        return Util.invokeChaincode(securityContext, functionName, [ value, diseaseID ]);
    }

    doesdiseaseIDExist(userId, diseaseID) {
        let securityContext = this.usersToSecurityContext[userId];
	
	//console.log("another ",Util.queryChaincode(securityContext, 'check_unique_v5c', [ diseaseID ]));
        return Util.queryChaincode(securityContext, 'check_unique_v5c', [ diseaseID ]);
    }

    static newdiseaseID() {
        let numbers = '1234567890';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let diseaseID = '';
        for(let i = 0; i < 7; i++)
            {
            diseaseID += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        diseaseID = characters.charAt(Math.floor(Math.random() * characters.length)) + diseaseID;
        diseaseID = characters.charAt(Math.floor(Math.random() * characters.length)) + diseaseID;
	console.log("inside function diseaseID ",diseaseID);
        return diseaseID;
    }
}

module.exports = Disease;
