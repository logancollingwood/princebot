// import the discord.js module
const Discord = require('discord.js');
const Config = require('../config');
const commandMap = require('./handlers/commandMap').commandMap;
const Helpers = require('../util/helpers');

// create an instance of a Discord Client, and call it bot
const bot = new Discord.Client();

const prefix = Config.prefix;

// create an event listener for messages
bot.on('message', message => {
    if(message.author.bot) return;
    let content = message.content;
    let channel = message.channel;
    if(!content.startsWith(prefix)) return;


    let parsed = Helpers.parseContent(content);
    console.log("Parsed " + parsed.command + " in channel " + channel + " with args " + parsed.args);

    if (commandMap.has(parsed.command)) {
        let callBack = commandMap.get(parsed.command);
        callBack(bot, message);
    }

});


bot.on('ready', () => {
   console.log("Prince is feelin' gucci, and ready to jam out to " + commandMap.size + " different commands");
});

bot.on("guildMemberAdd", (member) => {
    member.channel.sendMessage("Welcome to the server, " + member.name +  ". Please read the pinned posts!");
});

// log our bot in
bot.login(Config.token);