'use strict';

let express         = require('express');
let session         = require('express-session');
let cookieParser     = require('cookie-parser');
let bodyParser         = require('body-parser');
let app             = express();
let url             = require('url');
let cors             = require('cors');
let fs                 = require('fs');
let path = require('path');
let hfc = require('hfc');
let tracing = require(__dirname+'/Server_Side/tools/traces/trace.js');

let configFile = require(__dirname+'/Server_Side/configurations/configuration.js');

//Our own modules
let blocks             = require(__dirname+'/Server_Side/blockchain/blocks/blocks.js');
let block             = require(__dirname+'/Server_Side/blockchain/blocks/block/block.js');
let participants     = require(__dirname+'/Server_Side/blockchain/participants/participants.js');
let identity          = require(__dirname+'/Server_Side/admin/identity/identity.js');
let diseases         = require(__dirname+'/Server_Side/blockchain/assets/diseases/diseases.js');
let disease          = require(__dirname+'/Server_Side/blockchain/assets/diseases/disease/disease.js');
let demo              = require(__dirname+'/Server_Side/admin/demo/demo.js');
let chaincode          = require(__dirname+'/Server_Side/blockchain/chaincode/chaincode.js');
let transactions     = require(__dirname+'/Server_Side/blockchain/transactions/transactions.js');
let startup            = require(__dirname+'/Server_Side/configurations/startup/startup.js');
let http = require('http');

const SecurityContext = require(__dirname+'/Server_Side/tools/security/securitycontext');

// Object of users' names linked to their security context
let usersToSecurityContext = {};

let port = process.env.VCAP_APP_PORT || configFile.config.appPort;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({secret: 'Somethignsomething1234!test', resave: true, saveUninitialized: true}));

app.options('*', cors());
app.use(cors());
app.use(express.static(__dirname + '/Client_Side'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.post('/admin/identity', function(req, res, next)     //Sets the session user to have the account address for the page they are currently on
{
    identity.create(req, res, usersToSecurityContext);
});


app.post('/admin/demo', function(req, res, next)
{
    demo.create(req, res, next, usersToSecurityContext);
});

app.get('/admin/demo', function(req, res, next)
{
    demo.read(req, res, next, usersToSecurityContext);
});

//-----------------------------------------------------------------------------------------------
//    Blockchain - chaincode
//-----------------------------------------------------------------------------------------------
app.post('/blockchain/chaincode/diseases', function(req, res,next){
    chaincode.diseases.create(req, res,next,usersToSecurityContext);
});

app.get('/blockchain/blocks', function(req, res,next){
    blocks.read(req, res,next,usersToSecurityContext);
});

app.get('/blockchain/blocks/:blockNum(\\d+)', function(req, res, next){
    block.read(req, res, next, usersToSecurityContext);
});

app.post('/blockchain/assets/diseases' , function(req,res,next)
{
    diseases.create(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/assets/diseases' , function(req,res, next)
{
    diseases.read(req,res,next,usersToSecurityContext);
});


app.get('/blockchain/assets/diseases/:v5cID' , function(req,res,next)
{
    disease.read(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/assets/diseases/:v5cID/owner' , function(req,res,next)
{
    disease.owner.read(req,res,next,usersToSecurityContext);
});

app.put('/blockchain/assets/diseases/:v5cID/owner' , function(req,res,next)
{
    disease.owner.update(req,res,next,usersToSecurityContext);
});


app.get('/blockchain/assets/diseases/:v5cID/PIN' , function(req,res,next)
{
    disease.PIN.read(req,res,next,usersToSecurityContext);
});

app.put('/blockchain/assets/diseases/:v5cID/PIN' , function(req,res,next)
{
    disease.PIN.update(req,res,next,usersToSecurityContext);
});


app.get('/blockchain/assets/diseases/:v5cID/medicines' , function(req,res,next)
{
    disease.medicines.read(req,res,next,usersToSecurityContext);
});

app.put('/blockchain/assets/diseases/:v5cID/medicines' , function(req,res,next)
{
    disease.medicines.update(req,res,next,usersToSecurityContext);
});


app.get('/blockchain/assets/diseases/:v5cID/zipcode' , function(req,res,next)
{
    disease.zipcode.read(req,res,next,usersToSecurityContext);
});

app.put('/blockchain/assets/diseases/:v5cID/zipcode' , function(req,res,next)
{
    disease.zipcode.update(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/assets/diseases/:v5cID/symptoms' , function(req,res,next)
{
    disease.symptoms.read(req,res,next,usersToSecurityContext);
});

app.put('/blockchain/assets/diseases/:v5cID/symptoms' , function(req,res,next)
{
    disease.symptoms.update(req,res,next,usersToSecurityContext);
});


app.get('/blockchain/assets/diseases/:v5cID/diseasename' , function(req,res,next)
{
    disease.diseasename.read(req,res,next,usersToSecurityContext);
});

app.put('/blockchain/assets/diseases/:v5cID/diseasename' , function(req,res,next)
{

    disease.diseasename.update(req,res,next,usersToSecurityContext);
});


app.delete('/blockchain/assets/diseases/:v5cID' , function(req,res,next)
{
    disease.delete(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/assets/diseases/:v5cID/scrap' , function(req,res,next)
{
    disease.scrapped.read(req,res,next,usersToSecurityContext);
});


app.post('/blockchain/participants', function(req,res,next){
    participants.create(req, res,next,usersToSecurityContext);
});

app.get('/blockchain/participants', function(req,res,next){
    participants.read(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/participants/diseasenameulators', function(req, res,next){
    participants.diseasenameulators.read(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/participants/doctors', function(req, res,next){
    participants.doctors.read(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/participants/labs', function(req, res,next){
    participants.labs.read(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/participants/hospitals', function(req, res,next){
    participants.hospitals.read(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/participants/healthcaredepartments', function(req, res,next){
    participants.healthcaredepartments.read(req,res,next,usersToSecurityContext);
});

app.get('/blockchain/participants/researchinstitutes', function(req, res,next){
    participants.researchinstitutes.read(req,res,next,usersToSecurityContext);
});



app.get('/blockchain/transactions', function(req, res,next){
    transactions.read(req, res,next,usersToSecurityContext);
});


app.use(function (req, res, next) {
    let keys;
    console.log('------------------------------------------ incoming request ------------------------------------------');
    console.log('New ' + req.method + ' request for', req.url);
    req.bag = {};                                            //create my object for my stuff
    req.session.count = eval(req.session.count) + 1;
    req.bag.session = req.session;

    let url_parts = url.parse(req.url, true);
    req.parameters = url_parts.query;
    keys = Object.keys(req.parameters);
    if (req.parameters && keys.length > 0) {console.log({parameters: req.parameters});}        //print request parameters
    keys = Object.keys(req.body);
    if (req.body && keys.length > 0) {console.log({body: req.body});}                        //print request body
    next();
});

app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function (err, req, res, next) {        // = development error handler, print stack trace
    console.log('Error Handler -', req.url, err);
    let errorCode = err.status || 500;
    res.status(errorCode);
    if (req.bag) {
        req.bag.error = {msg: err.stack, status: errorCode};
        if (req.bag.error.status === 404) {
            req.bag.error.msg = 'Sorry, I cannot locate that file';
        }
    }
    res.send({'message':err});
});

// Track the application deployments
require('cf-deployment-tracker-client').track();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_ENV = 'production';
process.env.GOPATH = path.resolve(__dirname, 'Chaincode');

let vcapServices;
let pem;
let server;
let diseasenameistrar;
let credentials;
let webAppAdminPassword = configFile.config.diseasenameistrar_password;
if (process.env.VCAP_SERVICES) {
    console.log('\n[!] VCAP_SERVICES detected');
    port = process.env.PORT;
} else {
    port = configFile.config.appPort;
}

// Setup HFC
let chain = hfc.newChain('myChain');
//This is the location of the key store HFC will use. If running locally, this directory must exist on your machine
chain.setKeyValStore(hfc.newFileKeyValStore(configFile.config.key_store_location));


if(configFile.config.hfcProtocol === 'grpcs'){
    // chain.setECDSAModeForGRPC(true);
    pem = fs.readFileSync(__dirname+'/Chaincode/src/disease_code/'+configFile.config.certificate_file_name, 'utf8');
}


if (process.env.VCAP_SERVICES) { // We are running in bluemix
    credentials = JSON.parse(process.env.VCAP_SERVICES)['ibm-blockchain-5-prod'][0].credentials;
    console.log('\n[!] Running in bluemix');
    if (!pem) {
        console.log('\n[!] No certificate is available. Will fail to connect to fabric');
    }
    startup.connectToPeers(chain, credentials.peers, pem);
    startup.connectToCA(chain, credentials.ca, pem);
    
    webAppAdminPassword = configFile.config.bluemix_diseasenameistrar_password;

} else if (pem) { // We are running outside bluemix, connecting to bluemix fabric
    console.log('\n[!] Running locally with bluemix fabric');
    credentials = fs.readFileSync(__dirname + '/credentials.json');
    credentials = JSON.parse(credentials);

    webAppAdminPassword = configFile.config.bluemix_diseasenameistrar_password;

    startup.connectToPeers(chain, credentials.peers, pem);
    startup.connectToCA(chain, credentials.ca, pem);
    //startup.connectToEventHub(chain, credentials.peers[0], pem);

} else { // We are running locally
    let credentials = fs.readFileSync(__dirname + '/credentials.json');
    credentials = JSON.parse(credentials);
    startup.connectToPeers(chain, credentials.peers);
    startup.connectToCA(chain, credentials.ca);
    //startup.connectToEventHub(chain, credentials.peers[0]);
}

server = http.createServer(app).listen(port, function () {
    console.log('Server Up');
    tracing.create('INFO', 'Startup complete on port', server.address().port);
});
server.timeout = 2400000;

let demoStatus = {
    status: 'IN_PROGRESS',
    success: false,
    error: null
};

let eventEmitter;
let io = require('socket.io')(server);

io.sockets.on('connection', (socket) => {
    eventEmitter = socket;
    console.log('connected');
    eventEmitter.emit('setup', demoStatus);
});

function setSetupError(err) {
    demoStatus.status = 'ERROR';
    demoStatus.success = false;
    if (!process.env.VCAP_SERVICES) {
        demoStatus.error = 'There was an error starting the demo. Please try again.';
        demoStatus.detailedError = err.message || 'Server error';
    } else {
        demoStatus.error = 'There was an error starting the demo. Please try again. Ensure you delete both the demo and the blockchain service';
        demoStatus.detailedError = err.message || 'Server error';
    }
    if (eventEmitter) {
        eventEmitter.emit('setup', demoStatus);
    }
}


let chaincodeID;

return startup.enrolldiseasenameistrar(chain, configFile.config.diseasenameistrar_name, webAppAdminPassword)
.then(function(r) {
    diseasenameistrar = r;
    chain.setdiseasenameistrar(diseasenameistrar);
    tracing.create('INFO', 'Startup', 'Set diseasenameistrar');
    let users = configFile.config.users;
    if (vcapServices || pem) {
        users.forEach(function(user){
            user.affiliation = 'group1';
        });
    }
    return startup.enrollUsers(chain, users, diseasenameistrar);
})
.then(function(users) {
    tracing.create('INFO', 'Startup', 'All users diseasenameistered');
    users.forEach(function(user) {
        usersToSecurityContext[user.getName()] = new SecurityContext(user);
    });
})
.then(function(){
    tracing.create('INFO', 'Startup', 'Checking if chaincode is deployed');
    return new Promise(function(resolve, reject) {
        fs.readFile('chaincode.txt', 'utf8', function(err, contents) {
            if (err) {
                resolve(false);
            } else {
                resolve(contents);
            }
        });
    });
})
.then(function(cc) { //ChaincodeID exists or doesnt
    if (cc) {
        chaincodeID = cc;
        let sc = new SecurityContext(usersToSecurityContext.DVLA.getEnrolledMember());
        sc.setChaincodeID(chaincodeID);
        tracing.create('INFO', 'Chaincode error may appear here - Ignore, chaincode has been pinged', '');
        try {
            return startup.pingChaincode(chain, sc);
        } catch(e) {
            //ping didnt work
            return false;
        }
    } else {
        return false;
    }
})
.then(function(exists) {
    if (!exists) {
        let certPath = (vcapServices) ? vcapServices.cert_path : '/certs/peer/cert.pem';
        return startup.deployChaincode(diseasenameistrar, 'disease_code', 'Init', [], certPath);
    } else {
        tracing.create('INFO', 'Startup', 'Chaincode already deployed');
        return {'chaincodeID': chaincodeID};
    }
})
.then(function(deploy) {

    for (let name in usersToSecurityContext) {
        usersToSecurityContext[name].setChaincodeID(deploy.chaincodeID);
    }
    tracing.create('INFO', 'Startup', 'Chaincode successfully deployed');

    demoStatus.success = true;
    demoStatus.status = 'success';
    if (eventEmitter) {
        eventEmitter.emit('setup', demoStatus);
    }
})
.then(function() {
    setInterval(function(){
        startup.pingChaincode(chain, usersToSecurityContext.DVLA)
        .then((success) => {
            if (!success){
                setSetupError();
            } else {
                demoStatus.status = 'SUCCESS';
                demoStatus.success = true;
                demoStatus.error = null;
                demoStatus.detailedError = null;
            }
        });
    }, 0.5 * 60000);
})
.catch(function(err) {
    setSetupError(err);
    console.log(err);
    tracing.create('ERROR', 'Startup', err);
});
