const grp = require("../libraries/group.js");

//Commands is organized by {name:{syntax, description, params, function}}
var commands = {};

exports.DELIMITER = ".";

/*
Key for splitting paramaters
Caps are required paramaters
W for word, s for string, N for number
*/

/*
PROCESS
Go through required params from the front until s
Go through required params from the back until s
Evaluate s
Evaluate optional params from s from the front until none
Evaluate optional params from s from the back until none
return
*/

function splitParameters(splitString, params){
  params = params.split(/ +/);

  //Test to see if there are enough params
  let count = 0;
  for(let i=0;i<splitString.length;i++) if(splitString[i].toUpperCase() == splitString[i]) count++;
  if(params.length>=count){
    //If enough, evaluate params
    let ret = [];
    let rev = false;

    //Evaluate front (mix with back)
    for(let i=0;i!=splitString.indexOf("s")||!rev;rev?i--:i++){
      if(splitString[i].toUpperCase() == splitString[i]){
        if(matchesParamType(params[i],splitString[i])){
          ret.push(params.splice(i-ret.length,1));
        }else{
          //Incorrect parameter type, throw error
          throw "MISMATCHED_PARAMETER";
        }
      }else if(splitString[i]=="s"){
        //Reverse params and splitString
        rev = true;
        params = params.reverse();
        splitString = splitString.split("").reverse().join("");
      }
    }

    //Evaluate s

  }else{
    //Not enough params given, throw error
    throw "INSUFFICENT_PARAMETERS";
  }
}

function matchesParamType(param, type){
  switch(type.toLowerCase()){
    case "w":
      return /^[\w\d]+$/.test(param);
    case "n":
      return !isNaN(param);
    default:
      return true;
  }
}

exports.runCommand = (name, params) => {
  commands[name].func(params);
}

exports.findBestRawFit = (raw) => {

}

commands.test = {};
commands.test.func = (params) => {
  grp.autoAddToGroups();
};
