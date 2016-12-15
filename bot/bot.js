// import the discord.js module
const Discord = require('discord.js');
const Config = require('../config');
const commandMap = require('./handlers/commandMap').commandMap;
const Helpers = require('../util/helpers');
const player = require('./handlers/music/index.js');

// create an instance of a Discord Client, and call it bot
const bot = new Discord.Client();

// configure the music player
player(bot);

bot.on('ready', () => {
   console.log("Prince is feelin' gucci, and ready to jam out");
});

bot.on("guildMemberAdd", (member) => {
    member.channel.sendMessage("Welcome to the server, " + member.name +  ". Please read the pinned posts!");
});

// log our bot in
bot.login(Config.token);