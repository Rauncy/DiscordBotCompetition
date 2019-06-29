const https = require("https");
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
        if(err) resolve({});
        else{
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
  fs.writeFile(`./data/guilds/${guild.id}.json`, JSON.stringify(groups[guild.id]), (err) => {
    if(err) console.error(err);
    console.log(`Guild ${guild.id} saved`);
    if(!keep){
      let t = timeouts[guild.id];
      t.time = 0;
      t.reset();
    }
  });
};

exports.autoAddToGroups = (member) => {
  //Uses oauth2 connections to get the steam account and add to user
};

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
