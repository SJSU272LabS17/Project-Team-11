package main

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"encoding/json"
	"regexp"
)

var logger = shim.NewLogger("CLDChaincode")

//==============================================================================================================================
//	 Participant types - Each participant type is mapped to an integer which we use to compare to the value stored in a
//						 user's eCert
//==============================================================================================================================
//CURRENT WORKAROUND USES ROLES CHANGE WHEN OWN USERS CAN BE CREATED SO THAT IT READ 1, 2, 3, 4, 5
const   AUTHORITY      =  "regulator" //Patient
const   DOCTOR   	   =  "doctor"
const   PRIVATE_ENTITY =  "private" //Lab
const   HOSPITAL  =  "hospital"
const   RESEARCHINSTITUTE =  "researchInstitute"


//==============================================================================================================================
//	 Status types - Asset lifecycle is broken down into 5 statuses, this is part of the business logic to determine what can
//					be done to the patient at points in it's lifecycle
//==============================================================================================================================
const   STATE_TEMPLATE  			=  0
const   STATE_DOCTOR  				=  1
const   STATE_PRIVATE_OWNERSHIP 	=  2
const   STATE_HOSPITAL 				=  3
const   STATE_BEING_SCRAPPED  			=  4

//==============================================================================================================================
//	 Structure Definitions
//==============================================================================================================================
//	Chaincode - A blank struct for use with Shim (A HyperLedger included go file used for get/put state
//				and other HyperLedger functions)
//==============================================================================================================================
type  SimpleChaincode struct {
}

//==============================================================================================================================
//	Patient - Defines the structure for a car object. JSON on right tells it what JSON fields to map to
//			  that element when reading a JSON object into the struct e.g. JSON make -> Struct Make.
//==============================================================================================================================
type Patient struct {
	Name            string `json:"name"`
	patientID           string `json:"patientID"`
	Symptoms           string `json:"symptoms"`
	DiseaseName           string `json:"diseasename"`
	Medicines           string `json:"medicines"`
	Owner           string `json:"owner"`
	Status          int    `json:"status"`
}


//==============================================================================================================================
//	V5C Holder - Defines the structure that holds all the v5cIDs for vehicles that have been created.
//				Used as an index when querying all vehicles.
//==============================================================================================================================

type Patient_Holder struct {
	V5Cs 	[]string `json:"v5cs"`
}

//==============================================================================================================================
//	User_and_eCert - Struct for storing the JSON of a user and their ecert
//==============================================================================================================================

type User_and_eCert struct {
	Identity string `json:"identity"`
	eCert string `json:"ecert"`
}

//==============================================================================================================================
//	Init Function - Called when the user deploys the chaincode
//==============================================================================================================================
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	//Args
	//				0
	//			peer_address

	var patientIDs Patient_Holder

	bytes, err := json.Marshal(patientIDs)

    if err != nil { return nil, errors.New("Error creating Patient_Holder record") }

	err = stub.PutState("patientIDs", bytes)

	for i:=0; i < len(args); i=i+2 {
		t.add_ecert(stub, args[i], args[i+1])
	}

	return nil, nil
}

//==============================================================================================================================
//	 General Functions
//==============================================================================================================================
//	 get_ecert - Takes the name passed and calls out to the REST API for HyperLedger to retrieve the ecert
//				 for that user. Returns the ecert as retrived including html encoding.
//==============================================================================================================================
func (t *SimpleChaincode) get_ecert(stub shim.ChaincodeStubInterface, name string) ([]byte, error) {

	ecert, err := stub.GetState(name)

	if err != nil { return nil, errors.New("Couldn't retrieve ecert for user " + name) }

	return ecert, nil
}

//==============================================================================================================================
//	 add_ecert - Adds a new ecert and user pair to the table of ecerts
//==============================================================================================================================

func (t *SimpleChaincode) add_ecert(stub shim.ChaincodeStubInterface, name string, ecert string) ([]byte, error) {


	err := stub.PutState(name, []byte(ecert))

	if err == nil {
		return nil, errors.New("Error storing eCert for user " + name + " identity: " + ecert)
	}

	return nil, nil

}

//==============================================================================================================================
//	 get_caller - Retrieves the username of the user who invoked the chaincode.
//				  Returns the username as a string.
//==============================================================================================================================

func (t *SimpleChaincode) get_username(stub shim.ChaincodeStubInterface) (string, error) {

    username, err := stub.ReadCertAttribute("username");
	if err != nil { return "", errors.New("Couldn't get attribute 'username'. Error: " + err.Error()) }
	return string(username), nil
}

//==============================================================================================================================
//	 check_affiliation - Takes an ecert as a string, decodes it to remove html encoding then parses it and checks the
// 				  		certificates common name. The affiliation is stored as part of the common name.
//==============================================================================================================================

func (t *SimpleChaincode) check_affiliation(stub shim.ChaincodeStubInterface) (string, error) {
    affiliation, err := stub.ReadCertAttribute("role");
	if err != nil { return "", errors.New("Couldn't get attribute 'role'. Error: " + err.Error()) }
	return string(affiliation), nil

}

//==============================================================================================================================
//	 get_caller_data - Calls the get_ecert and check_role functions and returns the ecert and role for the
//					 name passed.
//==============================================================================================================================

func (t *SimpleChaincode) get_caller_data(stub shim.ChaincodeStubInterface) (string, string, error){

	user, err := t.get_username(stub)

    // if err != nil { return "", "", err }

	// ecert, err := t.get_ecert(stub, user);

    // if err != nil { return "", "", err }

	affiliation, err := t.check_affiliation(stub);

    if err != nil { return "", "", err }

	return user, affiliation, nil
}

//==============================================================================================================================
//	 retrieve_v5c - Gets the state of the data at v5cID in the ledger then converts it from the stored
//					JSON into the Patient struct for use in the contract. Returns the Vehcile struct.
//					Returns empty v if it errors.
//==============================================================================================================================
func (t *SimpleChaincode) retrieve_v5c(stub shim.ChaincodeStubInterface, patientID string) (Patient, error) {

	var v Patient

	bytes, err := stub.GetState(patientID);

	if err != nil {	fmt.Printf("RETRIEVE_V5C: Failed to invoke disease_code: %s", err); return v, errors.New("RETRIEVE_V5C: Error retrieving patient with v5cID = " + v5cID) }

	err = json.Unmarshal(bytes, &v);

    if err != nil {	fmt.Printf("RETRIEVE_V5C: Corrupt patient record "+string(bytes)+": %s", err); return v, errors.New("RETRIEVE_V5C: Corrupt patient record"+string(bytes))	}

	return v, nil
}

//==============================================================================================================================
// save_changes - Writes to the ledger the Patient struct passed in a JSON format. Uses the shim file's
//				  method 'PutState'.
//==============================================================================================================================
func (t *SimpleChaincode) save_changes(stub shim.ChaincodeStubInterface, v Patient) (bool, error) {

	bytes, err := json.Marshal(v)

	if err != nil { fmt.Printf("SAVE_CHANGES: Error converting patient record: %s", err); return false, errors.New("Error converting patient record") }

	err = stub.PutState(v.patientID, bytes)

	if err != nil { fmt.Printf("SAVE_CHANGES: Error storing patient record: %s", err); return false, errors.New("Error storing patient record") }

	return true, nil
}

//==============================================================================================================================
//	 Router Functions
//==============================================================================================================================
//	Invoke - Called on chaincode invoke. Takes a function name passed and calls that function. Converts some
//		  initial arguments passed to other things for use in the called function e.g. name -> ecert
//==============================================================================================================================
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	caller, caller_affiliation, err := t.get_caller_data(stub)

	if err != nil { return nil, errors.New("Error retrieving caller information")}


	if function == "create_patient" {
        return t.create_patient(stub, caller, caller_affiliation, args[0])
	} else if function == "ping" {
        return t.ping(stub)
    } else { 																				// If the function is not a create then there must be a car so we need to retrieve the car.
		argPos := 1

		if function == "scrap_patient" {																// If its a scrap patient then only two arguments are passed (no update value) all others have three arguments and the v5cID is expected in the last argument
			argPos = 0
		}

		v, err := t.retrieve_v5c(stub, args[argPos])

        if err != nil { fmt.Printf("INVOKE: Error retrieving v5c: %s", err); return nil, errors.New("Error retrieving v5c") }


        if strings.Contains(function, "update") == false && function != "scrap_patient"    { 									// If the function is not an update or a scrappage it must be a transfer so we need to get the ecert of the recipient.


				if 		   function == "authority_to_doctor" { return t.authority_to_doctor(stub, v, caller, caller_affiliation, args[0], "doctor")
				} else if  function == "doctor_to_private"   { return t.doctor_to_private(stub, v, caller, caller_affiliation, args[0], "private")
				} else if  function == "private_to_private" 	   { return t.private_to_private(stub, v, caller, caller_affiliation, args[0], "private")
				} else if  function == "private_to_hospital"  { return t.private_to_hospital(stub, v, caller, caller_affiliation, args[0], "hospital")
				} else if  function == "hospital_to_private"  { return t.hospital_to_private(stub, v, caller, caller_affiliation, args[0], "private")
				} else if  function == "private_to_researchInstitute" { return t.private_to_researchInstitute(stub, v, caller, caller_affiliation, args[0], "researchInstitute")
				}

		} else if function == "update_symptoms"  	    { return t.update_symptoms(stub, v, caller, caller_affiliation, args[0])
		} else if function == "update_diseasename"        { return t.update_diseasename(stub, v, caller, caller_affiliation, args[0])
		} else if function == "update_medicines" { return t.update_medicines(stub, v, caller, caller_affiliation, args[0])
		} else if function == "update_name" 			{ return t.update_name(stub, v, caller, caller_affiliation, args[0])
        } else if function == "update_zipcode" 		{ return t.update_zipcode(stub, v, caller, caller_affiliation, args[0])
		} else if function == "scrap_patient" 		{ return t.scrap_patient(stub, v, caller, caller_affiliation) }

		return nil, errors.New("Function of the name "+ function +" doesn't exist.")

	}
}
//=================================================================================================================================
//	Query - Called on chaincode query. Takes a function name passed and calls that function. Passes the
//  		initial arguments passed are passed on to the called function.
//=================================================================================================================================
func (t *SimpleChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	
 fmt.Printf(" Code reached in query"); 

	caller, caller_affiliation, err := t.get_caller_data(stub)
	if err != nil { fmt.Printf("QUERY: Error retrieving caller details", err); return nil, errors.New("QUERY: Error retrieving caller details: "+err.Error()) }

    logger.Debug("function: ", function)
    logger.Debug("caller: ", caller)
    logger.Debug("affiliation: ", caller_affiliation)

	if function == "get_disease_details" {
		if len(args) != 1 { fmt.Printf("Incorrect number of arguments passed"); return nil, errors.New("QUERY: Incorrect number of arguments passed") }
		v, err := t.retrieve_v5c(stub, args[0])
		if err != nil { fmt.Printf("QUERY: Error retrieving v5c: %s", err); return nil, errors.New("QUERY: Error retrieving v5c "+err.Error()) }
		return t.get_disease_details(stub, v, caller, caller_affiliation)
	} else if function == "check_unique_v5c" {
		return t.check_unique_v5c(stub, args[0], caller, caller_affiliation)
	} else if function == "get_diseases" {
		return t.get_diseases(stub, caller, caller_affiliation)
	} else if function == "get_ecert" {
		return t.get_ecert(stub, args[0])
	} else if function == "ping" {
		return t.ping(stub)
	}

	return nil, errors.New("Received unknown function invocation " + function)

}

//=================================================================================================================================
//	 Ping Function
//=================================================================================================================================
//	 Pings the peer to keep the connection alive
//=================================================================================================================================
func (t *SimpleChaincode) ping(stub shim.ChaincodeStubInterface) ([]byte, error) {
	return []byte("Hello, world!"), nil
}

//=================================================================================================================================
//	 Create Function
//=================================================================================================================================
//	 Create Patient - Creates the initial JSON for the vehcile and then saves it to the ledger.
//=================================================================================================================================
func (t *SimpleChaincode) create_patient(stub shim.ChaincodeStubInterface, caller string, caller_affiliation string, patientID string) ([]byte, error) {
	var v Patient

	patient_ID         := "\"patientID\":\""+patientID+"\", "							// Variables to define the JSON
	symptoms           := "\"Symptoms\":\"UNDEFINED\", "
	diseasename          := "\"DiseaseName\":\"UNDEFINED\", "
	medicines            := "\"Medicines\":\"UNDEFINED\", "
	owner          := "\"Owner\":\""+caller+"\", "
	name         := "\"Name\":\"UNDEFINED\", "
	leaseContract  := "\"LeaseContractID\":\"UNDEFINED\", "
	status         := "\"Status\":0, "
	scrapped       := "\"Scrapped\":false"

	disease_json := "{"+patient_ID+symptoms+diseasename+medicines+reg+owner+name+leaseContract+status+scrapped+"}" 	// Concatenates the variables to create the total JSON object

	matched, err := regexp.Match("^[A-z][A-z][0-9]{7}", []byte(patientID))  				// matched = true if the patientID passed fits format of two letters followed by seven digits

												if err != nil { fmt.Printf("CREATE_PATIENT: Invalid patientID: %s", err); return nil, errors.New("Invalid patientID") }

	if 				patient_ID  == "" 	 ||
					matched == false    {
																		fmt.Printf("CREATE_PATIENT: Invalid patientID provided");
																		return nil, errors.New("Invalid patientID provided")
	}

	err = json.Unmarshal([]byte(disease_json), &v)							// Convert the JSON defined above into a patient object for go

																		if err != nil { return nil, errors.New("Invalid JSON object") }

	record, err := stub.GetState(v.patientID) 								// If not an error then a record exists so cant create a new car with this patientID as it must be unique

																		if record != nil { return nil, errors.New("Patient already exists") }

	if 	caller_affiliation != AUTHORITY {							// Only the regulator can create a new v5c

		return nil, errors.New(fmt.Sprintf("Permission Denied. create_patient. %v === %v", caller_affiliation, AUTHORITY))

	}

	_, err  = t.save_changes(stub, v)

																		if err != nil { fmt.Printf("CREATE_PATIENT: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	bytes, err := stub.GetState("patientIDs")

																		if err != nil { return nil, errors.New("Unable to get patientIDs") }

	var patientIDs disease_Holder

	err = json.Unmarshal(bytes, &patientIDs)

																		if err != nil {	return nil, errors.New("Corrupt disease_Holder record") }

	patientIDs.V5Cs = append(patientIDs.V5Cs, patientID)


	bytes, err = json.Marshal(patientIDs)

															if err != nil { fmt.Print("Error creating disease_Holder record") }

	err = stub.PutState("patientIDs", bytes)

															if err != nil { return nil, errors.New("Unable to put the state") }

	return nil, nil

}

//=================================================================================================================================
//	 Transfer Functions
//=================================================================================================================================
//	 authority_to_doctor
//=================================================================================================================================
func (t *SimpleChaincode) authority_to_doctor(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, recipient_name string, recipient_affiliation string) ([]byte, error) {

	if     	v.Status				== STATE_TEMPLATE	&&
			v.Owner					== caller			&&
			caller_affiliation		== AUTHORITY		&&
			recipient_affiliation	== DOCTOR		&&
			v.Scrapped				== false			{		// If the roles and users are ok

					v.Owner  = recipient_name		// then make the owner the new owner
					v.Status = STATE_DOCTOR			// and mark it in the state of doctor

	} else {									// Otherwise if there is an error
															fmt.Printf("AUTHORITY_TO_DOCTOR: Permission Denied");
                                                            return nil, errors.New(fmt.Sprintf("Permission Denied. authority_to_doctor. %v %v === %v, %v === %v, %v === %v, %v === %v, %v === %v", v, v.Status, STATE_PRIVATE_OWNERSHIP, v.Owner, caller, caller_affiliation, PRIVATE_ENTITY, recipient_affiliation, SCRAP_DISEASE, v.Scrapped, false))


	}

	_, err := t.save_changes(stub, v)						// Write new state

															if err != nil {	fmt.Printf("AUTHORITY_TO_DOCTOR: Error saving changes: %s", err); return nil, errors.New("Error saving changes")	}

	return nil, nil									// We are Done

}

//=================================================================================================================================
//	 doctor_to_private
//=================================================================================================================================
func (t *SimpleChaincode) doctor_to_private(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, recipient_name string, recipient_affiliation string) ([]byte, error) {

	if 		v.Name 	 == "UNDEFINED" ||
			v.Symptoms  == "UNDEFINED" ||
			v.DiseaseName 	 == "UNDEFINED" ||
			v.Medicines == "UNDEFINED" {					//If any part of the car is undefined it has not bene fully manufacturered so cannot be sent
															fmt.Printf("DOCTOR_TO_PRIVATE: Patient not fully defined")
															return nil, errors.New(fmt.Sprintf("Patient not fully defined. %v", v))
	}

	if 		v.Status				== STATE_DOCTOR	&&
			v.Owner					== caller				&&
			caller_affiliation		== DOCTOR			&&
			recipient_affiliation	== PRIVATE_ENTITY		&&
			v.Scrapped     == false							{

					v.Owner = recipient_name
					v.Status = STATE_PRIVATE_OWNERSHIP

	} else {
        return nil, errors.New(fmt.Sprintf("Permission Denied. doctor_to_private. %v %v === %v, %v === %v, %v === %v, %v === %v, %v === %v", v, v.Status, STATE_PRIVATE_OWNERSHIP, v.Owner, caller, caller_affiliation, PRIVATE_ENTITY, recipient_affiliation, RESEARCHINSTITUTE, v.Scrapped, false))
    }

	_, err := t.save_changes(stub, v)

	if err != nil { fmt.Printf("DOCTOR_TO_PRIVATE: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}

//=================================================================================================================================
//	 private_to_private
//=================================================================================================================================
func (t *SimpleChaincode) private_to_private(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, recipient_name string, recipient_affiliation string) ([]byte, error) {

	if 		v.Status				== STATE_PRIVATE_OWNERSHIP	&&
			v.Owner					== caller					&&
			caller_affiliation		== PRIVATE_ENTITY			&&
			recipient_affiliation	== PRIVATE_ENTITY			&&
			v.Scrapped				== false					{

					v.Owner = recipient_name

	} else {
        return nil, errors.New(fmt.Sprintf("Permission Denied. private_to_private. %v %v === %v, %v === %v, %v === %v, %v === %v, %v === %v", v, v.Status, STATE_PRIVATE_OWNERSHIP, v.Owner, caller, caller_affiliation, PRIVATE_ENTITY, recipient_affiliation, RESEARCHINSTITUTE, v.Scrapped, false))
	}

	_, err := t.save_changes(stub, v)

															if err != nil { fmt.Printf("PRIVATE_TO_PRIVATE: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}

func (t *SimpleChaincode) private_to_hospital(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, recipient_name string, recipient_affiliation string) ([]byte, error) {

	if 		v.Status				== STATE_PRIVATE_OWNERSHIP	&&
			v.Owner					== caller					&&
			caller_affiliation		== PRIVATE_ENTITY			&&
			recipient_affiliation	== HOSPITAL			&&
            v.Scrapped     			== false					{

					v.Owner = recipient_name

	} else {
        return nil, errors.New(fmt.Sprintf("Permission denied. private_to_hospital. %v === %v, %v === %v, %v === %v, %v === %v, %v === %v", v.Status, STATE_PRIVATE_OWNERSHIP, v.Owner, caller, caller_affiliation, PRIVATE_ENTITY, recipient_affiliation, RESEARCHINSTITUTE, v.Scrapped, false))

	}

	_, err := t.save_changes(stub, v)
															if err != nil { fmt.Printf("PRIVATE_TO_HOSPITAL: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}

func (t *SimpleChaincode) hospital_to_private(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, recipient_name string, recipient_affiliation string) ([]byte, error) {

	if		v.Status				== STATE_PRIVATE_OWNERSHIP	&&
			v.Owner  				== caller					&&
			caller_affiliation		== HOSPITAL			&&
			recipient_affiliation	== PRIVATE_ENTITY			&&
			v.Scrapped				== false					{

				v.Owner = recipient_name

	} else {
		return nil, errors.New(fmt.Sprintf("Permission Denied. hospital_to_private. %v %v === %v, %v === %v, %v === %v, %v === %v, %v === %v", v, v.Status, STATE_PRIVATE_OWNERSHIP, v.Owner, caller, caller_affiliation, PRIVATE_ENTITY, recipient_affiliation, RESEARCHINSTITUTE, v.Scrapped, false))
	}

	_, err := t.save_changes(stub, v)
															if err != nil { fmt.Printf("HOSPITAL_TO_PRIVATE: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}

//=================================================================================================================================
//	 private_to_scrap_merchant
//=================================================================================================================================
func (t *SimpleChaincode) private_to_researchInstitute(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, recipient_name string, recipient_affiliation string) ([]byte, error) {

	if		v.Status				== STATE_PRIVATE_OWNERSHIP	&&
			v.Owner					== caller					&&
			caller_affiliation		== PRIVATE_ENTITY			&&
			recipient_affiliation	== RESEARCHINSTITUTE			&&
			v.Scrapped				== false					{

					v.Owner = recipient_name
					v.Status = STATE_BEING_SCRAPPED

	} else {
        return nil, errors.New(fmt.Sprintf("Permission Denied. private_to_researchInstitute. %v %v === %v, %v === %v, %v === %v, %v === %v, %v === %v", v, v.Status, STATE_PRIVATE_OWNERSHIP, v.Owner, caller, caller_affiliation, PRIVATE_ENTITY, recipient_affiliation, RESEARCHINSTITUTE, v.Scrapped, false))
	}

	_, err := t.save_changes(stub, v)

															if err != nil { fmt.Printf("PRIVATE_TO_CITIZEN: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}

//=================================================================================================================================
//	 Update Functions
//================================================================================================================================
func (t *SimpleChaincode) update_pin(stub shim.ChaincodeStubInterface, v Vehicle, caller string, caller_affiliation string, new_value string) ([]byte, error) {

	new_vin, err := strconv.Atoi(string(new_value)) 		                // will return an error if the new vin contains non numerical chars

															if err != nil || len(string(new_value)) != 15 { return nil, errors.New("Invalid value passed for new VIN") }

	if 		v.Status			== STATE_MANUFACTURE	&&
			v.Owner				== caller				&&
			caller_affiliation	== MANUFACTURER			&&
			v.VIN				== 0					&&			// Can't change the VIN after its initial assignment
			v.Scrapped			== false				{

					v.VIN = new_vin					// Update to the new value
	} else {

        return nil, errors.New(fmt.Sprintf("Permission denied. update_pin %v %v %v %v %v", v.Status, STATE_MANUFACTURE, v.Owner, caller, v.VIN, v.Scrapped))

	}

	_, err  = t.save_changes(stub, v)						// Save the changes in the blockchain

															if err != nil { fmt.Printf("UPDATE_VIN: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}

func (t *SimpleChaincode) update_symptoms(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, new_value string) ([]byte, error) {

	new_vin, err := strconv.Atoi(string(new_value)) 		                // will return an error if the new vin contains non numerical chars

															//if err != nil || len(string(new_value)) != 15 { return nil, errors.New("Invalid value passed for new VIN") }
															if err != nil { return nil, errors.New("Invalid value passed for Symptoms") }

	if 		//v.Status			== STATE_DOCTOR	&&
			v.Owner				== caller				&&
			v.Scrapped			== false				{

					v.Symptons = new_vin					// Update to the new value
	} else {

        return nil, errors.New(fmt.Sprintf("Permission denied. update_symptoms %v %v %v %v %v", v.Status, STATE_DOCTOR, v.Owner, caller, v.Symptoms, v.Scrapped))

	}

	_, err  = t.save_changes(stub, v)						// Save the changes in the blockchain

															if err != nil { fmt.Printf("UPDATE_Symptons: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}


//=================================================================================================================================
//	 update_registration
//=================================================================================================================================
func (t *SimpleChaincode) update_diseasename(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, new_value string) ([]byte, error) {


	if		v.Owner				== caller			&&
			//caller_affiliation	!= RESEARCHINSTITUTE	&&
			v.Scrapped			== false			{

					v.DiseaseName = new_value

	} else {
        return nil, errors.New(fmt.Sprint("Permission denied. update_diseasename"))
	}

	_, err := t.save_changes(stub, v)

															if err != nil { fmt.Printf("UPDATE_DISEASENAME: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}

func (t *SimpleChaincode) update_medicines(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string, new_value string) ([]byte, error) {

	if 		v.Owner				== caller				&&
			v.Scrapped			== false				{

					v.Medicines = new_value
	} else {

		return nil, errors.New(fmt.Sprint("Permission denied. update_medicines %t %t %t" + v.Owner == caller, caller_affiliation == DOCTOR, v.Scrapped))
	}

	_, err := t.save_changes(stub, v)

		if err != nil { fmt.Printf("UPDATE_MEDICINES: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}


func (t *SimpleChaincode) update_zipcode(stub shim.ChaincodeStubInterface, v Vehicle, caller string, caller_affiliation string, new_value string) ([]byte, error) {

	if		v.Owner				== caller				&&
			v.Scrapped			== false				{

					v.ZipCode = new_value

	} else {
        return nil, errors.New(fmt.Sprint("Permission denied. update_zipcode %t %t %t" + v.Owner == caller, caller_affiliation == MANUFACTURER, v.Scrapped))

	}

	_, err := t.save_changes(stub, v)

															if err != nil { fmt.Printf("update_zipcode: Error saving changes: %s", err); return nil, errors.New("Error saving changes") }

	return nil, nil

}


//=================================================================================================================================
//	 scrap_patient
//=================================================================================================================================
func (t *SimpleChaincode) scrap_patient(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string) ([]byte, error) {

	if		v.Status			== STATE_BEING_SCRAPPED	&&
			v.Owner				== caller				&&
			caller_affiliation	== RESEARCHINSTITUTE		&&
			v.Scrapped			== false				{

					v.Scrapped = true

	} else {
		return nil, errors.New("Permission denied. scrap_patient")
	}

	_, err := t.save_changes(stub, v)

															if err != nil { fmt.Printf("SCRAP_DISEASE: Error saving changes: %s", err); return nil, errors.New("SCRAP_DISEASE Error saving changes") }

	return nil, nil

}

//=================================================================================================================================
//	 Read Functions
//=================================================================================================================================
//	 get_vehicle_details
//=================================================================================================================================
func (t *SimpleChaincode) get_disease_details(stub shim.ChaincodeStubInterface, v Patient, caller string, caller_affiliation string) ([]byte, error) {

	bytes, err := json.Marshal(v)

																if err != nil { return nil, errors.New("GET_DISEASE_DETAILS: Invalid patient object") }

	if 		v.Owner				== caller		||
			caller_affiliation	== AUTHORITY	{

					return bytes, nil
	} else {
																return nil, errors.New("Permission Denied. get_disease_details")
	}

}

//=================================================================================================================================
//	 get_vehicles
//=================================================================================================================================

func (t *SimpleChaincode) get_diseases(stub shim.ChaincodeStubInterface, caller string, caller_affiliation string) ([]byte, error) {
	fmt.Printf("QUERY: Error retrieving caller details", err); 
	return nil, errors.New("QUERY: Error retrieving caller details: "+err.Error()) }

    logger.Debug("function: ", function)
	//return []byte("false"), nil
}

//=================================================================================================================================
//	 check_unique_v5c
//=================================================================================================================================
func (t *SimpleChaincode) check_unique_v5c(stub shim.ChaincodeStubInterface, v5c string, caller string, caller_affiliation string) ([]byte, error) {
	fmt.Printf("*********inside check_unique_v5c"); 
	_, err := t.retrieve_v5c(stub, v5c)
	if err == nil {
		return []byte("false"), errors.New("V5C is not unique")
	} else {
		return []byte("true"), nil
	}
}

//=================================================================================================================================
//	 Main - main - Starts up the chaincode
//=================================================================================================================================
func main() {

	err := shim.Start(new(SimpleChaincode))

															if err != nil { fmt.Printf("Error starting Chaincode: %s", err) }
}
