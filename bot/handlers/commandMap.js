const musicPlayer = require('./music/musicPlayer');
const Config = require('../../config');
const commandMap = new Map();


const pong = function(bot, message) {
    console.log("Handling pong command");
    message.reply("pong")
    	.then(msg => msg.delete(Config.deleteTimeout)
    	.catch(console.log));
};


commandMap.set("ping", pong);
commandMap.set("play", musicPlayer.playTrack);
commandMap.set("stop", musicPlayer.stopTrack);

module.exports.commandMap = commandMap;