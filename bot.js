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

bot.on("ready", ()=>{
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
  let text = message.content;
  if(text.startsWith(comms.DELIMITER)){
    comms.runCommand(message);
  }
});

api.getKey("token").then((data) => {
  bot.login(data);
});
