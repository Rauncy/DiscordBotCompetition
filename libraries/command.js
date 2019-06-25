const grp = require("../libraries/group.js");

//Commands is organized by {name:{syntax, description, params, function}}
var commands = {};

exports.DELIMITER = ".";

function splitParameters(splitString, params){

}

exports.runCommand = (name, params) => {
  commands[name].func(params);
}

exports.findBestRawFit = (raw) => {
  
}

commands.test = {};
commands.test.func = (params) => {
  grp.autoAddToGroups();
};
