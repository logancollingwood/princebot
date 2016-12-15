// const YTDL = require('ytdl-core');
// const Helpers = require('../../../util/helpers');
// const Config = require('../../../config');
//
// let dispatcher;
// let voiceChannel;
//
// exports.playTrack = function (bot, message) {
//     let parsed = Helpers.parseContent(message.content);
//     let channel = message.channel;
//
//     // command comes in as play [link]
//     // parsed.args = [https://www.youtube.blah];
//     if (parsed.args.length > 1 || parsed.args.length == 0) {
//         message.reply("Play command accepts a single argument, which is a youtube URL" +
//             "formatted like so: " + "https://www.youtube.com/watch?v=someYoutubeId")
//             .then(msg => {
//                 msg.delete(Config.deleteTimeout)
//             }).catch(console.log);
//         return;
//     }
//
//     let url = parsed.args[0];
//     console.log("attempting to play " + url);
//
//     if (!Helpers.isDefined(voiceChannel)) {
//         message.reply("Please join a voice channel before queueing a song.")
//             .then(msg => {
//                 msg.delete(Config.deleteTimeout)
//             }).catch(console.log);
//         return;
//     }
//
//     if (voiceChannel != null) {
//         if (voiceChannel.id != message.member.voiceChannel.id) {
//             message.reply("Bot is already in the voice channel : " + voiceChannel.name);
//             message.delete(Config.deleteTimeout);
//             return;
//         } else {
//
//         }
//     }
//
//     voiceChannel = message.member.voiceChannel;
//
//     voiceChannel.join()
//     .then(connection => {
//         const stream = YTDL(url, {filter: 'audioonly'})
//         const streamOptions = { seek: 0, volume: 1, passes: 1 };
//         dispatcher = connection.playStream(stream, streamOptions);
//     })
//     .catch(console.error);
// };
//
// exports.disconnect = function(bot, message) {
//     if (Helpers.isDefined(voiceChannel)) {
//         voiceChannel.leave();
//         voiceChannel = null;
//     }
// };
//
// exports.stopTrack = function(bot, message) {
//     message.reply("stoppin that ish");
//     if (Helpers.isDefined(dispatcher)) {
//         dispatcher.end();
//         dispatcher = null;
//     }
// };