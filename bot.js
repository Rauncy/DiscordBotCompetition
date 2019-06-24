const djs = require("discord.js");
const readline = require("readline");
const fs = require("fs");

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

fs.readFile("./details.json", (err, data) => {
  data = JSON.parse(data);
  bot.login(data.token);
  const disAPI = data.secret;
  const steAPI = data.steamAPI;
  const batAPI = data.battlenetAPI;
});
