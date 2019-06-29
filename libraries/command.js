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

//Evaluate params given and needed params to group them up and eval them
function splitParameters(splitString, params){
  params = params.split(/ +/);
  console.log("P");
  console.log(params);
  if(params[0]==""&&params.length===1) params = [];
  //Evaluate params
  let ret = [];
  let req = 0;
  let opt;
  let befS = 0, aftS = 0;
  let sPas = false;
  let sReq = false;
  let sInd;
  for(let i=0;i<splitString.length;i++){
    if(splitString[i].toUpperCase()=="S"){
      sPas = true;
      sInd = i;
    }
    if(splitString[i].toUpperCase()==splitString[i]){
      req++;
      if(splitString[i]=="S") sReq = true;
    }else{
      if(sPas) aftS++;
      else befS++;
    }
  }
  opt = params.length-req;
  if(params.length>=req){
    //Fill req params
    sPas = false;
    let evaled = 0, evalF = 0, evalB = 0;
    let ret = [];
    //Eval all except s
    for(let i=0;i<splitString.length&&evaled<params.length-(sReq?1:0);i++){
      let sPos = i+(sPas?params.length-splitString.length:0);
      if(splitString[i].toLowerCase()!="s"){
        if(splitString[i].toUpperCase()==splitString[i]){
          //Is req, process
          if(matchesParamType(params[sPos], splitString[i])){
            ret.push(params[sPos]);
            evaled++;
            if(!sPas) evalF++;
            else evalB++;
          }else{
            //Throw error
            throw {
              type : "MISMATCHED_PARAMETER",
              mismatch : {
                expected : splitString[i].toLowerCase()=="n"?"number":"word",
                got : params[sPos]
              }
            };
          }
        }else{
          //Is opt, determine if process
          if(opt>0 && (!sPas || aftS<=opt)){
            //Process
            //Total remainingOpt
            if(matchesParamType(params[sPos], splitString[i])){
              ret.push(params[sPos]);
              evaled++;
              if(!sPas) evalF++;
              else evalB++;
            }else{
              //Throw error
              throw {
                type : "MISMATCHED_PARAMETER",
                mismatch : {
                  expected : splitString[i].toLowerCase()=="n"?"number":"word",
                  got : params[sPos]
                }
              };
            }
            opt--;
          }
          if(sPas) aftS--;
        }
      }else sPas = true;
    }

    //Eval s
    if(evaled<params.length && sInd != null){
      //evalFront
      console.log("S");
      ret.splice(evalF, 0, params.slice(evalF, params.length-evalB).join(" "));
    }

    return ret;
  }else{
    //Throw insifficent params
    throw {
      type : "INSUFFICENT_PARAMETERS",
    };
  }
}

function matchesParamType(param, type){
  console.log(`p: ${param} t: ${type}`);
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
      let text = message.content.substring(name.length+exports.DELIMITER.length+1);
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
  console.log(raw);
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
  console.log("S");
  console.log(params);
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

addCommand("bestfit", {params : ""}, (message, params)=>{
  /*message.author.client.broadcasts.forEach((key, value, map) => {
    console.log(key + " " + value);
  });*/
  var caught = false;
  try {
    console.log(message.member.voiceChannel.members);
  }
  catch (err) {
    caught = true;
  }

  if (!caught) {
    // Get all the games that all these players have

    var players = message.member.voiceChannel.members.keyArray();
    var validGames = [];
    //console.log(players);
    grp.getGuild(message.guild).then((data)=>{
      Object.keys(data).forEach((g)=>{
        let ids = data[g];
        var everyPlayer = true;
        players.forEach((p)=>{
          if (!ids.includes(p)) {
            everyPlayer = false;
          }
        });
        if (everyPlayer) {
          var m = new Map();
          m.set(g, ids);
          //console.log(m);
          validGames.push(m);
        }
      });
      //console.log(validGames);

      //Sorting games based on the least number of people who have them
      for (var o = 0; o < validGames.length; o++) {
        for (var i = o + 1; i < validGames.length; i++) {
          if (validGames[i].values().next().value.length < validGames[o].values().next().value.length) {
            var temp = validGames[i];
            validGames[i] = validGames[o];
            validGames[o] = temp;
          }
        }
      }
      //console.log(validGames);

      var str = "Your Best Fit Games\n";
      for (var i = 0; i < validGames.length; i++) {
        var count;
        str += (i + 1) + ". " + validGames[i].keys().next().value + "\n";
      }

      message.channel.send(str);
    }).catch((err)=>{console.error(err);});

  }
  else {
    message.channel.send("You must be in a voice channel to use this command.")
  }
});

addCommand("add", {
  params : "WWS",
  description : "Add is used for adding people to groups in the group list",
  syntax : ["Person", "to", "Group"]
}, (message, params) => {
  params.splice(1,0);
  let member = message.guild.fetchMember(params[0].match(/<@!?(\d{18})>/)[1]).then((member)=>{
    let n = member.nickname?member.nickname:member.user.username;
    grp.addToGroup(member, params[2]).then((d)=>{
      switch(d.status){
        case "SUCCESS":
          message.channel.send({embed:{
            color : 3196712,
            title : "Added to group successfully",
            fields : [
              {
                name : `${n} has been added to ${params[2]} successfully`,
                value : `To remove from ${params[2]}, use \`${exports.DELIMITER}remove ${exports.syntaxOf("remove").slice(0,1).join(" ")} [${params[2]}]\``
              }
            ]
          }});
          break;
        case "PRESENT":
          message.channel.send({embed:{
            color : 15583545,
            title : "Error adding to group",
            fields : [
              {
                name : `${n} is already in \`${params[2]}\``,
                value : `${n} cannot be added to a group multiple times`
              }
            ]
          }});
          break;
        case "NO_GROUP":
          message.channel.send({embed:{
            color : 12663844,
            title : "Error adding to group",
            fields : [
              {
                name : `\`${params[2]}\` is not a group`,
                value : `${n} cannot be added to ${params[2]} because that group doesn't exist`
              }
            ]
          }});
          break;
        }
    });
  });
});

addCommand("add group", {
  params : "S",
  description : "Add group is used for adding groups to the group list",
  syntax : ["Group name"]
}, (message, params) => {
  grp.addGroup(message.guild, params[0]).then((d) => {
    switch(d.status){
      case "SUCCESS":
        message.channel.send({embed:{
          color : 3196712,
          title : "Group added successfully",
          fields : [
            {
              name : `\`${params[0]}\` has been created`,
              value : `To add people to this group, use \`${exports.DELIMITER}add to group ${exports.syntaxOf("add").join(" ")}\``
            }
          ]
        }});
        break;
      case "PRESENT":
        grp.getGuild(message.guild).then((data) => {
          let lead = data[params[0]].slice(0,3);
          let fin = (data[params[0]].length>3?' ...':"");
          message.channel.send({embed:{
            color : 15583545,
            title : "Error adding group",
            fields : [
              {
                name : `\`${params[0]}\` already exists so it cannot be added`,
                value : `\`${params[0]}\` includes <@${lead.join("> <@")}>${fin}`
              }
            ]
          }});
        });
        break;
    }
  });
});

addCommand("remove", {
  params : "WWS",
  description : "Remove is used for removing people to groups in the group list",
  syntax : ["Person", "from", "Group"]
}, (message, params) => {
  message.guild.fetchMember(params[0].match(/<@!?(\d{18})>/)[1]).then((member) => {
    let n = member.nickname?member.nickname:member.user.username;
    grp.removeFromGroup(member, params[2]).then((d) => {
      switch(d.status){
        case "SUCCESS":
          message.channel.send({embed:{
            color : 3196712,
            title : "Removed from group successfully",
            fields : [
              {
                name : `${n} has been removed from ${params[2]} successfully`,
                value : `To add to ${params[2]}, use \`${exports.DELIMITER}add ${exports.syntaxOf("add").slice(0,1).join(" ")} ${params[2]}\``
              }
            ]
          }});
          break;
        case "ABSENT":
          message.channel.send({embed:{
            color : 15583545,
            title : "Error removing from group",
            fields : [
              {
                name : `${n} is not in \`${params[2]}\``,
                value : `${n} cannot be removed from a group they are not in`
              }
            ]
          }});
          break;
        case "NO_GROUP":
          message.channel.send({embed:{
            color : 12663844,
            title : "Error removing from group",
            fields : [
              {
                name : `\`${params[2]}\` is not a group`,
                value : `${n} cannot be removed from ${params[2]} because that group doesn't exist`
              }
            ]
          }});
          break;
      }
    });
  });
});

addCommand("remove group", {
  params : "S",
  description : "Remove group is used for removing groups to the group list",
  syntax : ["Group name"]
}, (message, params) => {
  grp.removeGroup(message.guild, params[0]).then((d) => {
    switch(d.status){
      case "SUCCESS":
        message.channel.send({embed:{
          color : 3196712,
          title : "Group removed successfully",
          fields : [
            {
              name : `\`${params[0]}\` has been removed`,
              value : "All users in this group have been removed from the group as well"
            }
          ]
        }});
        break;
      case "PRESENT":
        grp.getGuild(message.guild).then((data) => {
          let lead = data[params[0]].slice(0,3);
          message.channel.send({embed:{
            color : 15583545,
            title : "Error removing group",
            fields : [
              {
                name : `\`${params[0]}\` doesn't exists so it cannot be removed`,
                value : `To add this group, use \`${exorts.DELIMITER}add group ${params[0]}\``
              }
            ]
          }});
        });
        break;
    }
  });
});

addCommand("list", {
  params : "s",
  description : "Gives a list of all the groups for the server or a specific group if given",
  syntax : ["Group"]
}, (message, params) => {
  grp.getGuild(message.guild).then((data) => {
    if(params.length===0){
      message.channel.send({embed:{
        color : 4223940,
        title : "All groups",
        fields : [
          {
            name : "List of all the groups in the server",
            value : `\`${Object.keys(data).join("`, `")}\``
          }
        ]
      }});
    }else{
      if(data[params[0]]){
        let names = [];
        let proms = [];
        data[params[0]].forEach((v) => {
          proms.push(message.guild.fetchMember(v).then((member) => {
            names.push(member);
          }).catch((err) => {
            grp.removeFromGroup({
              id : v,
              guild : message.guild
            });
          }));
        });
        Promise.all(proms).then((res) => {
          message.channel.send({embed:{
            color : 4223940,
            title : `${params[0]} group`,
            fields : [
              {
                name : `List of all the users in ${params[0]}`,
                value : `${names.join("`, `")}`
              }
            ]
          }});
        });
      }else{
        //Error for no group
        message.channel.send({embed:{
          color : 15583545,
          title : "Error listing group",
          fields : [
            {
              name : `\`${params[0]}\` doesn't exists so it cannot be listed`,
              value : `To add this group, use \`${exorts.DELIMITER}add group ${params[0]}\``
            }
          ]
        }});
      }
    }
  });
});
