// import the discord.js module
const Discord = require('discord.js');
const config = require('../config');
const commandMap = require("./handlers/commandMap").commandMap;

// create an instance of a Discord Client, and call it bot
const bot = new Discord.Client();

const prefix = config.prefix;

// create an event listener for messages
bot.on('message', message => {
    if(message.author.bot) return;
    let content = message.content;
    let channel = message.channel;
    if(!content.startsWith(prefix)) return;


    let parsed = parseContent(content);
    console.log("Parsed " + parsed.command + " in channel " + channel + " with args " + parsed.args);

    if (commandMap.has(parsed.command)) {
        let callBack = commandMap.get(parsed.command);
        callBack(channel, parsed);
    }

});

const parseContent = function(content) {
    let indexOfSpace = content.indexOf(" ");
    let command = "";
    let args = [];
    if (indexOfSpace == -1) { // no space, command is just !COMMAND
        command = content.replace(prefix, "").toLowerCase();
    } else { // space, so command is !COMMAND args
        command = content.substring(content.lastIndexOf("!")+1, content.indexOf(" ")).toLowerCase();
        args = content.replace(prefix + command + " ", "");
        args = args.split(" ");
    }

    return {
        "content" : content,
        "command" : command,
        "args": args
    }
};

bot.on('ready', () => {
   console.log("Prince is feelin' gucci, and ready to jam out to " + commandMap.size + " different commands");
});

bot.on("guildMemberAdd", (member) => {
    member.channel.sendMessage("Welcome to the server, " + member.name +  ". Please read the pinned posts!");
});

// log our bot in
bot.login(config.token);