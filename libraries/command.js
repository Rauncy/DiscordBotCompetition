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
  params = params.trim();
  if(params.length>0) params = params.split(/ +/);
  else params = [];
  console.log(params.length);

  //Analyze parameters
  let req = 0;

  for(let i=0;i<splitString.length;i++){
    if(splitString[i].toUpperCase() == splitString[i]) req++;
  }
  if(params.length>=req){
    //If enough, evaluate params
    let ret = [];
    let revRet = [];
    let rev = false;
    let evaled = 0;

    //Evaluate front
    for(let i=0;(i!=splitString.toLowerCase().indexOf("s")||!rev)&&i<splitString.length;i++){
      if(splitString[i].toUpperCase() == splitString[i]){
        if(matchesParamType(params[i],splitString[i])){
          let tAdd = params[i];
          params[i] = "";
          if(rev) revRet.push(tAdd);
          else ret.push(tAdd);
          evaled++;
        }else{
          //Incorrect parameter type, throw error
          throw {
            type : "MISMATCHED_PARAMETER",
            mismatch : {
              expected : splitString[i].toLowerCase()=="n"?"Number":"Word",
              got : params[i]
            }
          };
        }
      }else if(splitString[i].toLowerCase()=="s"){
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

    //Evaluate optional params
    for(let i=0;(i!=splitString.toLowerCase().indexOf("s")||!rev)&&i<splitString.length;i++){
      if(splitString[i].toLowerCase()=="s"){
        //Reverse params and splitString
        rev = true;
        params = params.reverse();
        splitString = splitString.split("").reverse().join("");
        i=-1;
      }else if(splitString[i].toLowerCase() == splitString[i]){
        if(matchesParamType(params[i],splitString[i])){
          if(rev) ret = ret.slice(0,ret.length-i).concat([params[i]], ret.slice(ret.length-i));
          else ret = ret.slice(0,i).concat([params[i]], ret.slice(i));
          params[i] = "";
          evaled++;
        }else{
          //Incorrect parameter type, throw error
          throw {
            type : "MISMATCHED_PARAMETER",
            mismatch : {
              expected : splitString[i].toLowerCase()=="n"?"Number":"Word",
              got : params[i]
            }
          };
        }
      }
    }
    //Evaluate s
    if(params.length>evaled){
      splitString = splitString.split("").reverse().join("");
      params = params.reverse();
      let sInd = splitString.toLowerCase().indexOf("s");
      for(let i=0;i<params.length;i++){
        if(params[i]==""){
          params.splice(i,1);
          i--;
        }
      }
      ret = ret.slice(0,sInd).concat([params.join(" ")], ret.slice(sInd));
    }
    return ret;

  }else{
    //Not enough params given, throw error
    throw {
      type : "INSUFFICENT_PARAMETERS",
    };
  }
}

function matchesParamType(param, type){
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
  console.log("CONT " + message.content);
  if(message.content.startsWith(exports.DELIMITER)){
    let name = exports.findBestRawFit(message.content);
    if(name){
      let text = message.content.substring(name.length+1);

      //Execute command procedures
      try{
        commands[name].run(message, splitParameters(commands[name].params, text));
      }catch(err){
        if(err.type){
          err.culprit = name;
          throw err;
        }
        else console.error(err);
      }
    }else{
      //Command does not exist!
      throw {
        type : "NO_COMMAND",
        culprit : message.content.split(" ")[0]
      };
    }
  }
}

exports.findBestRawFit = (raw) => {
  if(raw.startsWith(exports.DELIMITER)){
    raw = raw.substring(exports.DELIMITER.length);
  }
  let com = "";
  Object.keys(commands).forEach((v) => {
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
  console.log(params);
  if(params.length===0){
    //List commands
    message.channel.send({embed:{
      color : 4223940,
      title : `Help`,
      fields : [
        {
          name : "All actions",
          value : `\`${exports.DELIMITER}${Object.keys(commands).join(`\`, \`${exports.DELIMITER}`)}\``
        },
        {
          name : "Additional help",
          value : `For help on a specific command, please use \`${exports.DELIMITER}help ${exports.syntaxOf("help").join(" ")}\``
        }
      ]
    }});
  }else{
    //Provide help on a specific command
    let name = exports.findBestRawFit(params[0]);
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
            value : `For information on using \`${exports.DELIMITER}${name}\`, use \`${exports.DELIMITER}syntax ${name}\``
          }
        ]
      }});
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
  }
});

exports.syntaxOf = (name) => {
  if(commands[name]){
    let pars = [];
    let synt = commands[name].syntax;
    let brk = commands[name].params;
    for(let i=0;i<synt.length;i++){
      let add = brk[i].toLowerCase() == brk[i]?"(":"[";
      add+=synt[i]+(add.startsWith("(")?")":"]");
      pars.push(add);
    }
    return pars;
  }
};

addCommand("syntax", {
  params : "S",
  description : "Help syntax is a command to help you learn how to use certain commands by telling you what the parameters are and if they are optional or not",
  syntax : ["Command"]
}, (message, params) => {
  let name = exports.findBestRawFit(params[0]);
  console.log(name);
  if(name){
    let pars = exports.syntaxOf(params[0]);
    message.channel.send({embed:{
      color : 4223940,
      title : `Syntax for the ${name} action`,
      fields : [
        {
          name : "Key for parameters",
          value : "These *[parameters]* are constant where as these *(parameters)* are optional."
        },
        {
          name : "Parameters",
          value : `\`${pars.join(" ")}\``
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
