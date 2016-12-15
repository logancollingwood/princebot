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
    if (args.length > 1 || args.length == 0) {
        message.reply("Cleanup expects a single argument, the number of messages to clean")
            .then(reply => {
                reply.delete(Config.deleteTimeout);
                message.delete(Config.deleteTimeout);
            });
        return;
    }
    message.channel.bulkDelete(args.first());
};

exports.lol  = function(message) {
    message.reply("lol")
        .then(reply => {
            reply.delete(Config.deleteTimeout);
            message.delete(Config.deleteTimeout);
        });
};