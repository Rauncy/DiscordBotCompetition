const https = require("https");
const http = require("http");
const fs = require("fs")
const apis = require("./api.js");

/*
Groups is organized {guild:{group:[users]}} chached for 24hrs
Users is organized {user:{game:{stats}}} cached for 6hrs, recached upon request
Timeouts is organized {dir:Cleanup} cached varyingly
*/
var groups = {}, users = {}, timeouts = {}, steam = {};

function Cleanup(key, time, remove){
  this.time = time;
  this.rem = remove;
  this.key = key;
  this.reset();
}

Cleanup.prototype.reset = function(){
  if(this.timeout) clearTimeout(this.timeout);
  this.timeout = setTimeout(() => {
    console.log(`Unloading ${this.key}`);
    this.rem(this);
    delete timeouts[this.key];
  }, this.time*3600000);
};

exports.getGuild = (guild) => {
  return new Promise(function(resolve, reject) {
    if(!groups[guild.id]){
      fs.readFile(`./data/guilds/${guild.id}.json`, (err, data) => {
        if(err) resolve({});
        else{
          let g = JSON.parse(data);
          let s = g.steam;
          g=g.groups;
          resolve(g);
          groups[guild.id] = g;
          steam[guild.id] = s;
          timeouts[guild.id] = new Cleanup(guild.id, 24, (obj)=>{
            delete groups[obj.key];
            delete steam[obj.key];
          });
          console.log(`Loaded guild data for ${guild.id}`);
        }
      });
    }else{
      resolve(groups[guild.id]);
      timeouts[guild.id].reset();
    }
  });
};

// exports.getUser = (user) => {
//   return new Promise(function(resolve, reject) {
//     if(!users[user.id]){
//       fs.readFile(`./data/users/${user.id}.json`, (err, data) => {
//         if(err){
//           reject("NO_USER");
//         }else{
//           let g = JSON.parse(data);
//           resolve(g);
//           users[user.id] = g;
//           timeouts[user.id] = new Cleanup(user.id, 6, (obj)=>{
//             delete users[obj.key];
//           });
//           console.log(`Loaded user data for ${user.id}`);
//         }
//       });
//     }else{
//       resolve(users[user.id]);
//       timeouts[user.id].reset();
//     }
//   });
// };

exports.saveGuild = (guild, keep = true) => {
  let tw = {};
  tw.groups = groups[guild.id];
  tw.steam = steam[guild.id];
  fs.writeFile(`./data/guilds/${guild.id}.json`, JSON.stringify(tw), (err) => {
    if(err) console.error(err);
    console.log(`Guild ${guild.id} saved`);
    if(!keep){
      let t = timeouts[guild.id];
      t.time = 0;
      t.reset();
    }
  });
};

// exports.saveUser = (user, keep = true) => {
//   fs.writeFile(`../data/users/${user.id}.json`, JSON.stringify(users[user.id]), () => {
//     if(!keep){
//       let t = timeouts[user.id];
//       t.time = 0;
//       t.reset();
//     }
//   });
// };

exports.addToGroup = async (member, group) => {
  return new Promise(function(resolve, reject) {
    exports.getGuild(member.guild).then((data) => {
      if(data[group]){
        //Group exists
        if(data[group].includes(member.id)){
          //Already is in group
          resolve({
            status : "PRESENT"
          });
        }else{
          groups[member.guild.id][group].push(member.id);
          exports.saveGuild(member.guild);
          resolve({
            status : "SUCCESS"
          });
        }
      }else{
        //Group doesn't exists
        resolve({
          status : "NO_GROUP",
          name : group
        });
      }
    });
  });
};

exports.removeFromGroup = async (member, group) => {
  return new Promise(function(resolve, reject) {
    exports.getGuild(member.guild).then((data) => {
      if(data[group]){
        //Group exists
        if(data[group].includes(member.id)){
          //Is in group
          groups[member.guild.id][group].splice(data[group].indexOf(member.id), 1);
          exports.saveGuild(member.guild);
          resolve({
            status : "SUCCESS"
          });
        }else{
          resolve({
            status : "ABSENT"
          });
        }
      }else{
        //Group doesn't exists
        resolve({
          status : "NO_GROUP",
          name : group
        });
      }
    });
  });
};

exports.addGroup = async (guild, group) => {
  return new Promise((resolve, reject) => {
    exports.getGuild(guild).then((data) => {
      if(!data[group]){
        groups[guild.id][group] = [];
        exports.saveGuild(guild);
        resolve({
          status : "SUCCESS"
        });
      }else{
        console.log("NOP");
        resolve({
          status : "PRESENT"
        });
      }
    });
  });
};

exports.removeGroup = async (guild, group) => {
  return new Promise(function(resolve, reject) {
    exports.getGuild(guild).then((data) => {
      if(data[group]){
        delete groups[guild.id][group];
        exports.saveGuild(guild);
        resolve({
          status : "SUCCESS"
        });
      }else{
        resolve({
          status : "ABSENT"
        });
      }
    });
  });
}

exports.associateGame = (group, guild, gameID) => {
  return new Promise(function(resolve, reject) {
    exports.getGuild(guild).then(data => {
      if(data[group]){
        //If group exists
        steam[guild.id][group] = gameID;
        exports.saveGuild(guild);
        resolve({
          status : "SUCCESS"
        });
      }else{
        resolve({
          status : "NO_GROUP"
        });
      }
    });
  });
}

exports.getSteamID64 = async (steamURL) => {
  //run post https://steamid.io/lookup?input=
  //https://steamcommunity.com/id/rauncy/
  return new Promise(function(resolve, reject) {
    let p = steamURL.match(/steamcommunity\.com\/(.+)\/?/)[1];
    var req = https.request(steamURL, (res) => {

      res.on('data', (d) => {
        //"steamid":"(\d+)"
        let str = d.toString().match(/"steamid":"(\d+)"/);
        if(str){
          resolve(str[1]);
        }
      });
    });

    req.on('error', (e) => {
      console.error(e);
    });

    req.write("");
    req.end();
  });
};

exports.getGames = (steamID) => {
  return new Promise(function(resolve, reject) {
    apis.getKey("steamAPI").then((key) => {
      console.log(key);
      let req = http.request(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${key}&steamid=${steamID}&format=json`, (res) => {
        res.on('data', (d) => {
          //"steamid":"(\d+)"
          let obj = JSON.parse(d.toString()).response;
          let games = obj.games;
          games.sort((a, b) => {
            return (a.playtime_forever - b.playtime_forever)>0?-1:1;
          });
          resolve(games);
        });
      });

      req.on('error', (e) => {
        console.error(e);
      });

      req.write("");
      req.end();
    });
  });
};

exports.addUserWSteam = (member, games) => {
  return new Promise(function(resolve, reject) {
    exports.getGuild(member.guild).then(data => {
      let s = Object.values(steam[member.guild.id]);
      let k = Object.keys(steam[member.guild.id]);
      let total = 0;
      console.log(s);
      games.forEach(v => {
        console.log(v.appid);
        if(s.includes(""+v.appid)){
          console.log("YW");
          total++;
          exports.addToGroup(member, k[s.indexOf(""+v.appid)]);
        }
      });
      resolve(total);
    });
  });
};

// exports.getGameName = (gameID) => {
//   return new Promise(function(resolve, reject) {
//     apis.getKey("steamAPI").then((key) => {
//       console.log(key);
//       let req = http.request(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${key}&appid=${gameID}`, (res) => {
//         res.on('data', (d) => {
//           //"steamid":"(\d+)"
//           setTimeout(()=>{
//             let ret = JSON.parse(d.toString());
//             console.log(ret);
//             resolve(ret);
//           },500);
//         });
//       });
//
//       req.on('error', (e) => {
//         console.error(e);
//       });
//
//       req.write("");
//       req.end();
//     });
//   });
// };
