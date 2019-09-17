//Created by Rauncy and 0tpyrk for Discord's Hack Week 2019

const djs = require("discord.js");
const readline = require("readline");
const fs = require("fs");
const comms = require("./libraries/command.js");
const api = require("./libraries/api.js");

const rl = readline.createInterface({
  input : process.stdin,
  output : process.stdout
});
const bot = new djs.Client();
exports.bot = bot;

bot.on("ready", ()=>{
  comms.setupListeners();
  bot.user.setPresence({
    status : "online",
    game : {
      name : "the Discord Bot Competition",
      type : "WATCHING"
    }
  });
  console.log("Bot logged in successfully!");
});

bot.on("message", (message) => {
  if (message.channel.type == "dm" && message.author.bot != true) {
    //insert code to read games off steam profile
  }
  let text = message.content;
  if(text.startsWith(comms.DELIMITER)){
    try{
      comms.runCommand(message);
    }catch(err){
      console.log("OOF " +JSON.stringify(err));
      switch(err.type){
        case "INSUFFICENT_PARAMETERS":
          message.channel.send({embed:{
            color : 12663844,
            title : `Error executing ${err.culprit}`,
            fields : [
              {
                name : "Insufficent Parameters",
                value : `\`${err.culprit}\` received too little parameters.`
              },
              {
                name : "Proper Usage",
                value : `\`${comms.DELIMITER}${err.culprit} ${comms.syntaxOf(err.culprit).join(" ")}\``
              }
            ]
          }});
          break;
        case "MISMATCHED_PARAMETER":
          message.channel.send({embed:{
            color : 12663844,
            title : `Error executing ${err.culprit}`,
            fields : [
              {
                name : "Incorrect Parameters",
                value : `${err.culprit} received a wrong type of parameter.`
              },
              {
                name : "Details",
                value : `Expected a ${err.mismatch.expected} in the place of \`${err.mismatch.got}\`.`
              }
            ]
          }});
          break;
        case "NO_COMMAND":
        message.channel.send({embed:{
          color : 12663844,
          title : `Error executing ${err.culprit}`,
          fields : [
            {
              name : "Command doesn't exist",
              value : `${err.culprit} is not a recognised action.`
            }
          ]
        }});
      }
    }
  }
});

bot.on("guildCreate", (guild) => {
  fs.writeFile(`./data/guilds/${guild.id}.json`, "{\"groups\":{},\"steam\":{}}", (err) => {
    console.log("Started groups for guild " + guild.id);
  });
});

api.getKey("token").then((data) => {
  bot.login(data);
});
