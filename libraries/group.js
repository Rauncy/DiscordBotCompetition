const https = require("https");
const http = require("http");
const fs = require("fs")
const apis = require("./api.js");

/*
Groups is organized {guild:{group:[users]}} chached for 24hrs
Users is organized {user:{game:{stats}}} cached for 6hrs, recached upon request
Timeouts is organized {dir:Cleanup} cached varyingly
*/
var groups = {}, users = {}, timeouts = {};

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
          resolve(g);
          groups[guild.id] = g;
          timeouts[guild.id] = new Cleanup(guild.id, 24, (obj)=>{
            delete groups[obj.key];
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

exports.getUser = (user) => {
  return new Promise(function(resolve, reject) {
    if(!users[user.id]){
      fs.readFile(`./data/users/${user.id}.json`, (err, data) => {
        if(err){
          reject("NO_USER");
        }else{
          let g = JSON.parse(data);
          resolve(g);
          users[user.id] = g;
          timeouts[user.id] = new Cleanup(user.id, 6, (obj)=>{
            delete users[obj.key];
          });
          console.log(`Loaded user data for ${user.id}`);
        }
      });
    }else{
      resolve(users[user.id]);
      timeouts[user.id].reset();
    }
  });
};

exports.saveGuild = (guild, keep = true) => {
  fs.writeFile(`../data/guilds/${guild.id}.json`, JSON.stringify(guilds[guild.id]), () => {
    if(!keep){
      let t = timeouts[guild.id];
      t.time = 0;
      t.reset();
    }
  });
};

exports.saveUser = (user, keep = true) => {
  fs.writeFile(`../data/users/${user.id}.json`, JSON.stringify(users[user.id]), () => {
    if(!keep){
      let t = timeouts[user.id];
      t.time = 0;
      t.reset();
    }
  });
};

exports.addToGroup = (member, group) => {
  exports.getGuild(member.guild.id).then((data) => {
    if(data[group]){
      //Group exists
      if(data[group].includes(member.id)){
        //Already is in group
        return {
          status : "PRESENT"
        }
      }else{
        data[group].push(member.id);
        exports.saveGuild(member.guild.id);
        return {
          status : "SUCCESS"
        }
      }
    }else{
      //Group doesn't exists
      return {
        status : "NO_GROUP",
        name : group
      }
    }
  });
};

exports.removeFromGroup = (member, group) => {
  exports.getGuild(member.guild.id).then((data) => {
    if(data[group]){
      //Group exists
      if(data[group].includes(member.id)){
        //Is in group
        data[group].splice(data[group].indexOf(member.id), 1);
        exports.saveGuild(member.guild.id);
        return {
          status : "SUCCESS"
        }
      }else{
        return {
          status : "ABSENT"
        }
      }
    }else{
      //Group doesn't exists
      return {
        status : "NO_GROUP",
        name : group
      }
    }
  });
};

exports.addGroup = (guild, group) => {
  exports.getGuild(guild.id).then((data) => {
    if(!data[group]){
      data[group] = [];
      return {
        status : "SUCCESS"
      }
    }else{
      return {
        status : "PRESENT"
      }
    }
  });
};

exports.removeGroup = (guild, group) => {
  exports.getGuild(guild.id).then((data) => {
    if(data[group]){
      delete data[group];
      return {
        status : "SUCCESS"
      }
    }else{
      return {
        status : "ABSENT"
      }
    }
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

// exports.getGameName = (gameID) => {
//   return new Promise(function(resolve, reject) {
//     apis.getKey("steamAPI").then((key) => {
//       console.log(key);
//       let req = http.request(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${key}&appid=${gameID}`, (res) => {
//         res.on('data', (d) => {
//           //"steamid":"(\d+)"
//           console.log(d.toString());
//           let ret = JSON.parse(d.toString()).game.gameName;
//           console.log(ret);
//           resolve(ret);
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
