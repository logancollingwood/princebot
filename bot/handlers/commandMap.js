const commandMap = new Map();

const pong = function(message) {
    message.reply("pong")
        .catch(console.log);
};

const cabDriver = function(message) {
    message.reply("Cab Driver!! https://www.youtube.com/watch?v=ICeoqiCqkdg")
        .then(message.delete(60000))
        .catch(console.log);
};

const rollDice = function(message) {
    let val = Math.floor((Math.random() * 100) + 1);
    message.channel.sendMessage(`Rolled : ${val}`)
        .then(msg => {
            msg.delete(15000);
            message.delete(15000);
        })
        .catch(console.log);
};


commandMap.set("ping", pong);
commandMap.set("lady", cabDriver);
commandMap.set("roll", rollDice);

exports.commandMap = commandMap;