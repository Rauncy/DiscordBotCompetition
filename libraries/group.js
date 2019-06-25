const https = require("https");
const apis = require("./api.js");

exports.autoAddToGroups = (guild, user) => {
  apis.getKey("clientID").then((client) => {
    https.get(`https://discordapp.com/api/oauth2/authorize?response_type=token&client_id=${client}&scope=connections`, (res) => {
      console.log(res.statusCode);
      console.log(res.headers);
      res.on("data", (d) => {
        console.log(d.toString());
      });
    });
  });
}
