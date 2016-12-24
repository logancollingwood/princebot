let Config = require('../config');
let LOGGER = require("../util/logger");

exports.init = function() {
    LOGGER.log("initializing the lady killer");
    // import the discord.js module
    const Discord = require('discord.js');
    const Config = require('../config');
    const player = require('./handlers/music/dj');
    if (!Config.botChannel) Config.botChannel = 'general';

    // create an instance of a Discord Client, and call it bot
    const bot = new Discord.Client();

    // configure the music player
    player(bot);

    LOGGER.log("Booting up bot and setting up commands");

    bot.on('ready', () => {
       LOGGER.log("Prince is feelin' gucci, and ready to jam out");
    });

    bot.on("guildMemberAdd", (member) => {
        member.channel.sendMessage("Welcome to the server, " + member.name +  ". Please read the pinned posts!");
    });

    LOGGER.log(`Logging in using secret ${Config.token}`);
    // log our bot in
    bot.login(Config.token).catch(err => {
        LOGGER.error(err);
        process.exit()
    });
}