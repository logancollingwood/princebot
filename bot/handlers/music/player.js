const Config = require("../../../config");
const Helpers = require("../../../util/helpers");
const YTDL = require("ytdl-core");
class Player {

    constructor() {
        this.voiceChannel = null;
        this.connection = null;
        this.dispatcher = null;
        this.queue = [];
    }

    playTrack (message) {
        let parsed = Helpers.parseContent(message.content);
        let channel = message.channel;

        // command comes in as play [link]
        // parsed.args = [https://www.youtube.blah];
        if (parsed.args.length > 1 || parsed.args.length == 0) {
            message.reply("Play command accepts a single argument, which is a youtube URL" +
                "formatted like so: " + "https://www.youtube.com/watch?v=someYoutubeId")
                .then(msg => {
                    msg.delete(Config.deleteTimeout)
                }).catch(console.log);
            return;
        }

        let inThisVoiceChannel = message.member.voiceChannel;

        if (!Helpers.isDefined(inThisVoiceChannel)) {
            message.reply("Please join a voice channel before queueing a song.")
                .then(msg => {
                    msg.delete(Config.deleteTimeout)
                }).catch(console.log);
            return;
        }

        if (this.voiceChannel != null) {
            if (this.voiceChannel.id != message.member.voiceChannel.id) {
                message.reply("Bot is already in a voice channel : " + this.voiceChannel.name);
                message.delete(Config.deleteTimeout);
                return;
            }
        } else {
            this.voiceChannel = inThisVoiceChannel;
            let url = parsed.args[0];

            if (this.connection == null) {
                this.voiceChannel.join()
                    .then(connection => {
                        this.connection = connection;
                        console.log("attempting to play " + url);
                        this.enqueue(url);
                        this.play();
                    })
                    .catch(console.error);
            } else {
                this.enqueue(url);
                if (this.queue.length == 1) {
                    this.play();
                }
            }
        }
    };

    stopTrack() {
        if (this.dispatcher != null) {
            this.dispatcher.end();
            this.dispatcher = null;
        }
    }

    disconnect() {
        if (this.voiceChannel != null) {
            this.voiceChannel.leave();
            this.voiceChannel = null;
            this.connection = null;
            this.dispatcher = null;
            this.queue = [];
        }
    }

    play() {
        if (this.connection != null) {
            if (this.queue.length > 0) {
                let url = this.queue[0];
                const stream = YTDL(url, {filter: 'audioonly'});
                const streamOptions = {seek: 0, volume: 1, passes: 1};
                this.dispatcher = this.connection.playStream(stream, streamOptions);
                this.dispatcher.once("end", () => {
                    this.queue.shift(); // push the song out of the queue
                    this.play(); // play the next song
                });
            }
        }
    }

    enqueue(url) {
        this.queue.push(url);
    }

}

exports.player = Player;