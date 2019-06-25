const fs = require("fs");

var apiKeys = {};
var loaded = false;
var queue = [];

//THIS IS SUCH A BAD ASYNC IMPLEMENTATION I'M SORRY DISCORD
exports.getKey = (name) => {
  console.log("\"" + name + "\" is being gotten with the keys " + (loaded?"":"un") + "loaded");
  return new Promise(function(resolve, reject){
    if(loaded){
      if(apiKeys[name]){
        resolve(apiKeys[name]);
      }else{
        reject("Key is not found!");
      }
    }else{
      setTimeout(() => {
        exports.getKey(name).then((data) => {
          resolve(data);
        });
      },100);
    }
  });
}

fs.readFile("./details.json", (err, data) => {
  apiKeys = JSON.parse(data);
  loaded = true;
});
