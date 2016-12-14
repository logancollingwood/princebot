const YTDL = require('ytdl-core');
const Helpers = require('../../../util/helpers');
const Config = require('../../../config')

exports.playTrack = function (bot, message) {
    let parsed = Helpers.parseContent(message.content);
    let channel = message.channel;
    
    // command comes in as play [link]
    // parsed.args = [https://www.youtube.blah];
    if (parsed.args.length > 1) {
        message.reply("Play command accepts a single argument, which is a youtube URL" +
            "formatted like so: " + "https://www.youtube.com/watch?v=someYoutubeId")
        .then(msg => {
            msg.delete(Config.deleteTimeout)
        }).catch(console.log);
        return;
    }

    let url = parsed.args[0];
    console.log("attempting to play " + url);

    const voiceChannel = message.member.voiceChannel;
    
    if (!Helpers.isDefined(voiceChannel)) {
        message.reply("Please join a voice channel before queueing a song.")
        .then(msg => {
            msg.delete(Config.deleteTimeout)
        }).catch(console.log);
        return;
    }

    voiceChannel.join()
    .then(connection => {
        const stream = YTDL(url, {filter: 'audioonly'})
        const streamOptions = { seek: 0, volume: 1, passes: 1 };
        const dispatcher = connection.playStream(stream, streamOptions);
    })
    .catch(console.error);
};

exports.stopTrack = function(bot, message) {
    message.reply("stoppin that ish");
}