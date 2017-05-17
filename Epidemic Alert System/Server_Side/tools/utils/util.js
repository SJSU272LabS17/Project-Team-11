'use strict';

const ATTRS = ['username', 'role'];
const hfc = require('hfc');

class Util {
    static queryChaincode(securityContext, functionName, args) {

        try {
		console.log("in querychaincode "+functionName);
            if (!securityContext) {
                throw new Error('securityContext not provided');
            }  else if (!functionName) {
                throw new Error('functionName not provided');
            } else if (!args) {
                throw new Error('args not provided');
            }
	
	
            return new Promise(function(resolve, reject) {
                args.forEach(function(arg) {
                    if (typeof arg !== 'string') {
                        throw new Error('invalid arg specified ' + arg + ' in ', JSON.stringify(args));
                    }
                });
		
		
			
                let user = securityContext.getEnrolledMember();
		//console.log("USER ",user);

                let query = {
                    chaincodeID: securityContext.getChaincodeID(),
                    fcn: functionName,
                    args: args,
                    attrs: ATTRS
                };
		
		console.log("QUERYYY ",query);

                console.log('[#] Query: ', JSON.stringify(query));
		//console.log("DATA ",user.query(query));

                let tx = user.query(query);
		//console.log("tx.on ",tx.on);

                tx.on('submitted', function() {
                });

                tx.on('complete', function(data) {
                    resolve(data.result);
                });

                tx.on('error', function (err) {
		console.log("I AM HERE!!!");
                    if (err instanceof hfc.EventTransactionError) {
                        reject(new Error(err.msg));
                    } else {
                        reject(err);
                    }
                });
            });

        } catch(e) {
            console.log("my error ",e);
        }
    }

    static invokeChaincode(securityContext, functionName, args) {
        try {
		console.log("in invokechaincode "+functionName);
            if (!securityContext) {
                throw new Error('securityContext not provided');
            } else if (!functionName) {
                throw new Error('functionName not provided');
            } else if (!args) {
                throw new Error('args not provided');
            }

            return new Promise(function(resolve, reject) {
                args.forEach(function(arg) {
                    if (typeof arg !== 'string') {
                        throw new Error('invalid arg specified ' + arg + ' in ', args);
                    }
                });

                let user = securityContext.getEnrolledMember();

                let invoke = {
                    chaincodeID: securityContext.getChaincodeID(),
                    fcn: functionName,
                    args: args,
                    attrs: ATTRS
                };

                //console.log('[#] Invoke: ', JSON.stringify(invoke));

                let tx = user.invoke(invoke);
		
                tx.on('submitted', function(data) {
                });

                tx.on('complete', function(data) {
		//console.log(" tx ="+JSON.stringify(data.result));

                    resolve(data.result);
                });

                tx.on('error', function (err) {
                    if (err instanceof hfc.EventTransactionError) {
                        reject(new Error(err.msg));
                    } else {
                        reject(err);
                    }
                });
            });
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = Util;
