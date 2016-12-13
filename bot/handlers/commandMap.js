var ytdl = require('ytdl-core');

let commandMap = new Map();


let pong = function(channel, parsed) {
    console.log("Handling pong command");
    channel.sendMessage("pong");
};


let playTrack = function(channel, parsed) {
    // command comes in as play [link]
    if (parsed.args.length > 1) {
        channel.sendMessage("Play command accepts a single argument, which is a youtube URL" +
            "formatted like so: " + "https://www.youtube.com/watch?v=someYoutubeId");
        return;
    }

    let url = parsed.args[0];
    console.log("attempting to play " + url);


};


commandMap.set("ping", pong);
commandMap.set("play", playTrack);

module.exports.commandMap = commandMap;