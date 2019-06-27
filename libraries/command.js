const grp = require("../libraries/group.js");

//Commands is organized by {name:{syntax, description, params, function}}
var commands = {};

exports.DELIMITER = "!";

/*
Key for splitting paramaters
Caps are required paramaters
W for word, s for string, N for number
*/

/*
PROCESS
Go through required params from the front until s
Go through required params from the back until s
Evaluate optional params from potential s from the front until none
Evaluate optional params from potential s from the back until none
Evaluate s
return
*/
function addCommand(name, details, run){
  if(!commands[name]){
    let {params, syntax, description} = details;
    commands[name] = {};
    commands[name].syntax = syntax;
    commands[name].description = description;
    commands[name].params = params;
    commands[name].run = run;
    return true;
  }else return false;
}

function splitParameters(splitString, params){
  params = params.split(/ +/);

  console.log(params);
  console.log(splitString);
  console.log("\n");

  //Analyze parameters
  let req = 0;
  let beforeS = true;
  let befCount = 0;
  let aftCount = 0;

  for(let i=0;i<splitString.length;i++){
    if(splitString[i].toUpperCase() == splitString[i]) req++;
    else if(splitString[i]=="s") beforeS = false;
    else if(beforeS) befCount++;
    else aftCount++;
  }
  if(params.length>=req){
    //If enough, evaluate params
    let ret = [];
    let revRet = [];
    let rev = false;
    let evaled = 0;

    //Evaluate front
    for(let i=0;(i!=splitString.indexOf("s")||!rev)&&i<splitString.length;i++){
      console.log("REQ "+i);
      console.log(splitString[i] + " " + params[i]);
      if(splitString[i].toUpperCase() == splitString[i]){
        if(matchesParamType(params[i],splitString[i])){
          let tAdd = params[i];
          params[i] = "";
          if(rev) revRet.push(tAdd);
          else ret.push(tAdd);
          evaled++;
        }else{
          //Incorrect parameter type, throw error
          throw "MISMATCHED_PARAMETER";
        }
      }else if(splitString[i]=="s"){
        console.log("FLIP");
        //Reverse params and splitString
        rev = true;
        params = params.reverse();
        splitString = splitString.split("").reverse().join("");
        i=-1;
      }
    }

    //Put ret and revRet together in order
    ret = ret.concat(revRet.reverse());

    params = params.reverse();
    splitString = splitString.split("").reverse().join("");
    rev = false;

    console.log(params);
    console.log(splitString);
    console.log(ret);
    console.log("\n");

    //Evaluate optional params
    for(let i=0;(i!=splitString.indexOf("s")||!rev)&&i<splitString.length;i++){
      console.log("OPT "+i);
      console.log(splitString[i] + " " + params[i]);
      if(splitString[i]=="s"){
        //Reverse params and splitString
        console.log("FLIP");
        rev = true;
        params = params.reverse();
        splitString = splitString.split("").reverse().join("");
        i=-1;
      }else if(splitString[i].toLowerCase() == splitString[i]){
        if(matchesParamType(params[i],splitString[i])){
          console.log("RB");
          console.log(params[i]);
          console.log(ret);
          if(rev) ret = ret.slice(0,ret.length-i).concat([params[i]], ret.slice(ret.length-i));
          else ret = ret.slice(0,i).concat([params[i]], ret.slice(i));
          params[i] = "";
          evaled++;
          console.log(ret);
        }else{
          //Incorrect parameter type, throw error
          throw "MISMATCHED_PARAMETER";
        }
      }
    }

    console.log(params);
    console.log(splitString);
    console.log(ret);
    console.log("\n");

    //Evaluate s
    if(params.length>evaled){
      console.log("EVAL S");
      splitString = splitString.split("").reverse().join("");
      params = params.reverse();
      let sInd = splitString.indexOf("s");
      for(let i=0;i<params.length;i++){
        if(params[i]==""){
          params.splice(i,1);
          i--;
        }
      }
      console.log(params);
      ret = ret.slice(0,sInd).concat([params.join(" ")], ret.slice(sInd));
    }
    return ret;

  }else{
    //Not enough params given, throw error
    throw "INSUFFICENT_PARAMETERS";
  }
}

function matchesParamType(param, type){
  console.log(`${type} on "${param}"`);
  switch(type.toLowerCase()){
    case "w":
      return /^[^\s]+$/.test(param);
    case "n":
      return !isNaN(param);
    default:
      return true;
  }
}

exports.runCommand = (message) => {
  if(message.content.startsWith(exports.DELIMITER)){
    let com = "";
    let text = message.content.substring(exports.DELIMITER.length);
    Object.keys(commands).forEach((v) => {
      if(text.startsWith(v) && com.length<v.length) com = v;
    });
    if(com.length>0){
      text = text.substring(com.length+1);
      commands[com].run(message, splitParameters(commands[com].params, text));
    }else{
      //Command does not exist!
      console.log(`${message.content.split(" ")[0]} is not a command!`);
    }
  }
}

exports.findBestRawFit = (raw) => {

}

//Command

addCommand("split", {params : "WwsW"}, (message, params) => {
  console.log("COMMAND PARAMS");
  console.log(params);
});

addCommand("bestfit", {params : ""}, (message, params)=>{
  message.author.client.broadcasts.forEach((key, value, map) => {
    console.log(key + " " + value);
  });
  console.log(message.member.voiceChannel.members);
});
