import { displayProgress } from "./utils";
import { db } from "../../../config";

var myKey = "NEWKEY";
var DBCONST = "TESTDB";
var dbUserRef;

// 🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧
// Setup and helper functions
// 🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧
export function setupDB(dbConst) {
    DBCONST = dbConst;
}

//Helper function to check if the DB id is my ID
function isNotMyId(id) {
    var idCheck = id !== myKey && myKey !== "NEWKEY";
    return idCheck;
}

// 🤗🤗🤗🤗🤗🤗🤗🤗🤗🤗🤗🤗🤗
// Functions related to *self* (ie: client info -> server)
// 🤗🤗🤗🤗🤗🤗🤗🤗🤗🤗🤗🤗🤗

//Adds myself to firebase and initializes my ID
export function addMyselfToDB(callback) {
    //Create a reference for this user
    let userList = db.ref(DBCONST + "/users/");
    var newUserRef = userList.push();
    var newUserKey = newUserRef.key;
    myKey = newUserKey;
    writeMyPosToDB({ x: 0, y: 0, z: 0 });
    displayProgress("Initialized.. addedmyself to DB", [newUserKey]);

    //Let it be deleted when i disconnect
    newUserRef.onDisconnect().remove();
    dbUserRef = newUserRef;

    return myKey;
}

export function writeMyPosToDB(myPos) {
    if (myKey !== "NEWUSER") {
        var postData = { x: myPos.x, y: myPos.y, z: myPos.z };
        var dbUpdates = {};
        dbUpdates[DBCONST + "/users/" + myKey + "/pos"] = postData;
        db.ref().update(dbUpdates);
    }
}

export function writeMyStateToDB(state, value) {
    if (myKey !== "NEWUSER") {
        var postData = { value: value };
        var dbUpdates = {};
        dbUpdates[DBCONST + "/users/" + myKey + "/" + state] = postData;
        db.ref().update(dbUpdates);
    }
}

// 🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖
// Functions related to "NPCs" controlled by DB
// 🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖

function updateNPCState(id, values, updateNPCPosCallback, userStateCallbacks) {
    let valueKeys = Object.keys(values);

    valueKeys.forEach((key) => {
        if (key === "pos") {
            let pos = values["pos"];
            updateNPCPosCallback(id, pos.x, pos.y, pos.z);
        } else if (userStateCallbacks[key]) {
            let value = values[key].value;
            let callbackFunction = userStateCallbacks[key];
            callbackFunction(id, value);
        }
    });
}

export function forceRemovePlayer(key) {
    let userList = db.ref(DBCONST + "/users");
    userList.child(key).remove();
}

//  NPC adding/removing and movement functions
//Sets up callback functions to add, remove and update NLPs.
export function setupNPCFromDB(
    addNPCCallback,
    removeNPCCallback,
    updateNPCPosCallback,
    userStateCallbacks
) {
    let userList = db.ref(DBCONST + "/users");

    //Initial setup
    userList.once("value", (snapshot) => {
        displayProgress("Reading NPC values from DB", [snapshot]);
        snapshot.forEach((childSnapshot) => {
            let id = childSnapshot.key;
            if (isNotMyId(id)) {
                addNPCCallback(id);
            }
            //Add each of the values and callback
            let values = childSnapshot.val();
            updateNPCState(id, values, updateNPCPosCallback, userStateCallbacks);
        });
    });

    //On new child added (ie: new NPC)
    userList.on("child_added", (data) => {
        let id = data.key;
        if (isNotMyId(id)) {
            displayProgress("A new NPC has joined the room", [id]);
            addNPCCallback(id);
        }
    });

    //On Child removed (ie: NPC disconnected)
    userList.on("child_removed", (data) => {
        let id = data.key;
        removeNPCCallback(id);
        displayProgress("An NPC has left the room", [id]);
    });

    //On child updated (ie: NPC moved)
    userList.on("child_changed", (data) => {
        let id = data.key;
        if (isNotMyId(id)) {
            let values = data.val();
            updateNPCState(id, values, updateNPCPosCallback, userStateCallbacks);
        }
    });
}
// 🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍
// Functions related to "world state"
// 🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍

//For a given "state", setup its sync for DB
//Note the data structure (though invisible to client for this is)
// StateKeyName: "value": value
export function setupStateSyncFromDB(
    stateKey,
    stateChangeCallback,
    stateCanBeUserKey = false
) {
    var stateDBRef = db.ref(DBCONST + "/" + stateKey);
    stateDBRef.on("value", (data) => {
        if (data.val()) {
            let result = data.val();
            let value = result["value"];

            if (value != undefined) {
                stateChangeCallback(value);
            }
        }
    });

    if (stateCanBeUserKey) {
        checkStateStaleUserKey(stateKey);
    }
}

//Write a value for a given state to a DB
export function writeStateToDB(state, value) {
    var postData = { value: value };
    var dbUpdates = {};
    dbUpdates[DBCONST + "/" + state] = postData;
    db.ref().update(dbUpdates);
}

//Sometimes a global state variable can be a user key
//If they user key disconnects, the state variable can become stale
//This function enforces that a state variable of this kind can be either the value false, or a value in userkey
function checkStateStaleUserKey(stateKey) {
    let stateValue, userKeys;
    let DBRef = db.ref(DBCONST + "/");

    DBRef.once("value", (snapshot) => {
        let DBData = snapshot.val();

        let DBValueForState = DBData[stateKey];
        if (DBValueForState) {
            stateValue = DBValueForState["value"];

            if (stateValue !== false && stateValue !== undefined) {
                let users = DBData["users"];
                userKeys = Object.keys(users);

                displayProgress("User key heartbeat check for " + stateKey, [
                    stateValue,
                    userKeys,
                ]);

                var isStateValueInUserKey = stateValue in userKeys;
                if (!isStateValueInUserKey) {
                    writeStateToDB(stateKey, false);
                }
            }
        }
    });

    setTimeout(checkStateStaleUserKey, 5000);
}