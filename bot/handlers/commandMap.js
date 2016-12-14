const musicPlayer = require('./music/musicPlayer');

const commandMap = new Map();


const pong = function(bot, message) {
    console.log("Handling pong command");
    channel.sendMessage("pong");
};


commandMap.set("ping", pong);
commandMap.set("play", musicPlayer.playTrack);

module.exports.commandMap = commandMap;