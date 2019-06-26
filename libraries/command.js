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
Evaluate optional params from potential s from the front until none
Evaluate optional params from potential s from the back until none
Evaluate s
return
*/
function addCommand(name, details, run){
  if(!commands[name]){
    commands[name] = {};
    Object.keys(details).forEach((v)=>{
      commands[name][v] = details[v];
    });
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
    let name = exports.findBestRawFit(message.content);
    if(name){
      let text = message.content.substring(name.length+1);

      //Execute command procedures
      commands[name].run(message, splitParameters(commands[name].params, text));
    }else{
      //Command does not exist!
      console.log(`${message.content.split(" ")[0]} is not a command!`);
    }
  }
}

exports.findBestRawFit = (raw) => {
  if(raw.startsWith(exports.DELIMITER)){
    raw = raw.substring(exports.DELIMITER.length);
  }
  let com = "";
  Object.keys(commands).forEach((v) => {
    console.log(raw + " " + v + " " + com);
    if(raw.startsWith(v) && com.length<v.length) com = v;
  });
  if(com.length>0) return com;
  else return null;
}

//Commands

addCommand("help", {
  params : "s",
  description : "Help is a command to tell you to what each command the bot has to offer does and how to use them.",
  syntax : ["Command"]
}, (message, params) => {
  let name = exports.findBestRawFit(params[0]);
  console.log("HPAR " + params[0] + " " + name);
  if(name){
    message.channel.send({embed:{
      color : 4223940,
      title : `Help for the ${name} action`,
      fields : [
        {
          name : `${exports.DELIMITER}${name}`,
          value : `${commands[name].description}`
        },
        {
          name : "Further reading",
          value : `For information on using \`${exports.DELIMITER}${name}\`, use \`${exports.DELIMITER}help syntax ${name}\``
        }
      ]
    }})
    // message.channel.send(`Help for \`${exports.DELIMITER}${params[0]}\`:\n*${commands[name].description}*\nFor information on how to use \`${exports.DELIMITER}${name}\`, use \`${exports.DELIMITER}help syntax ${name}\``);
  }else{
    message.channel.send({embed:{
      color : 12663844,
      title : "Help error",
      fields : [
        {
          name : "Command does not exist",
          value : `\`${exports.DELIMITER}${params[0]}\` is not a command. Please enter a recognised command.`
        }
      ]
    }});
  }
});

addCommand("help syntax", {
  params : "s",
  description : "Help syntax is a command to help you learn how to use certain commands by telling you what the parameters are and if they are optional or not",
  syntax : ["Command"]
}, (message, params) => {
  let name = exports.findBestRawFit(params[0]);
  if(name){
    let pars = [];
    let synt = commands[name].syntax;
    let brk = commands[name].params;
    for(let i=0;i<synt.length;i++){
      let add = brk[i].toLowerCase() == brk[i]?"(":"[";
      add+=synt[i]+(add.startsWith("(")?")":"]");
      pars.push(add);
    }
    message.channel.send({embed:{
      color : 4223940,
      title : `Syntax for the ${exports.DELIMITER}${name} action`,
      fields : [
        {
          name : "Key for parameters",
          value : "These *[parameters]* are constant where as these *(parameters)* are optional."
        },
        {
          name : "Paramaters",
          value : pars.join(" ")
        }
      ]
    }});
  }else{
    //No such action
    message.channel.send({embed:{
      color : 12663844,
      title : "Syntax error",
      fields : [
        {
          name : "Command does not exist",
          value : `\`${exports.DELIMITER}${params[0]}\` is not a command. Please enter a recognised command.`
        }
      ]
    }});
  }
});
