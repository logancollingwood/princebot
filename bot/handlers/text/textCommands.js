const Config = require("../../../config");

exports.pong = function(msg) {
    msg.reply("Pong!")
        .then(reply => {
            reply.delete(Config.deleteTimeout);
            msg.delete(Config.deleteTimeout);
        })
};

exports.rollDice = function(msg) {
    let val = Math.floor((Math.random() * 100) + 1);
    msg.channel.sendMessage(`Rolled : ${val}`)
        .then(reply => {
            reply.delete(15000);
            msg.delete(15000);
        })
        .catch(console.log);
};

exports.cabDriver = function(message) {
    message.reply("Cab Driver!! https://www.youtube.com/watch?v=ICeoqiCqkdg")
        .then(reply => {
            reply.delete(60000);
            message.delete(60000);
        })
        .catch(console.log);
};

exports.cleanup = function(message, args) {
    let argsArr = args.split(' ');
    let deleteCount = argsArr[0];
    if (argsArr.length > 1 || argsArr.length == 0) {
        message.reply("Cleanup expects a single argument, the number of messages to clean")
            .then(reply => {
                reply.delete(Config.deleteTimeout);
                message.delete(Config.deleteTimeout);
            });
        return;
    }
    if (deleteCount > Config.maxDelete) {
        message.reply("The bot is configured to not allow deleting more than " + Config.maxDelete + " messages at a time")
            .then(reply => {
                reply.delete(Config.deleteTimeout);
                message.delete(Config.deleteTimeout);
            });
        return;
    }
    message.channel.bulkDelete(deleteCount);
    console.log(`Successfully deleted ${deleteCount} messages from channel ${message.channel.name}`)
};

exports.lol  = function(message) {
    message.reply("lol")
        .then(reply => {
            reply.delete(Config.deleteTimeout);
            message.delete(Config.deleteTimeout);
        });
};