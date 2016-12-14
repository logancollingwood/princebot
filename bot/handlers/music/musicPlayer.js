const YTDL = require('ytdl-core');
const Helpers = require('../../../util/helpers');


exports.playTrack = function (bot, message) {
    let parsed = Helpers.parseContent(message.content);
    let channel = message.channel;
    
    // command comes in as play [link]
    if (parsed.args.length > 1) {
        message.reply("Play command accepts a single argument, which is a youtube URL" +
            "formatted like so: " + "https://www.youtube.com/watch?v=someYoutubeId");
        return;
    }

    let url = parsed.args[0];
    console.log("attempting to play " + url);

    const voiceChannel = message.member.voiceChannel;
    
    if (!Helpers.isDefined(voiceChannel)) {
        message.reply("Please join a voice channel before queueing a song.");
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