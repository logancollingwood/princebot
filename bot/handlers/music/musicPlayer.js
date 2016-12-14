const YTDL = require('ytdl-core');
const Helpers = require('../../../util/helpers');


let playTrack = function (bot, message) {
    let parsed = Helpers.parseContent(message.content);
    let channel = message.channel;
    // command comes in as play [link]
    if (parsed.args.length > 1) {
        channel.sendMessage("Play command accepts a single argument, which is a youtube URL" +
            "formatted like so: " + "https://www.youtube.com/watch?v=someYoutubeId");
        return;
    }

    let url = parsed.args[0];
    console.log("attempting to play " + url);

    message.voiceChannel
    const voiceChannel = message.member.voiceChannel;
    console.log(voiceChannel);
    voiceChannel.join()
    .then(connection => {
        const stream = YTDL('https://www.youtube.com/watch?v=XAWgeLF9EVQ', {filter: 'audioonly'})
        console.log("Able to grab ytdl stream");
        const dispatcher = connection.playStream(stream, streamOptions);
    })
    .catch(console.error);
};


module.exports.playTrack = playTrack;