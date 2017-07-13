const YoutubeDL = require('youtube-dl');
const Request = require('request');
const Config = require('../../../config');
const TextHandler = require('../text/textCommands');
const util = require('util');
const logger = require('../../../util/logger');

/*
 * Takes a discord.js client and turns it into a music bot.
 *
 * @param client The discord.js client.
 * @param options (Optional) Options to configure the music bot. Acceptable options are:
 *                prefix: The prefix to use for the commands (default '!').
 *                global: Whether to use a global queue instead of a server-specific queue (default false).
 *                maxQueueSize: The maximum queue size (default 20).
 */
module.exports = function(client, options) {
    // Get all options.
    let PREFIX = (options && options.prefix) || '!';
    let GLOBAL = (options && options.global) || false;
    let MAX_QUEUE_SIZE = (options && options.maxQueueSize) || 20;

    logger.log("Setting up queues");
    // Create an object of queues.
    let queues = {};
    let queuesInfo = {};
    let isAvatarSet = false;
    if (!isAvatarSet) {
        logger.log("Setting up the prince icon");
        client.user.setAvatar('static/prince.jpg')
        .then(isAvatarSet = true);
    }

    // Catch message events.
    client.on('message', msg => {
        if(msg.author.bot) return;

        if (msg.channel.name !== Config.botChannel) {
            replyAndDelete(msg, "This bot only accepts commands in the " + Config.botChannel + " channel. " +
                "This helps keep our boards clear :). Your message will be deleted in " + Config.deleteTimeout / 1000 +
                " seconds");
            return;
        }

        const message = msg.content.trim();

        // Check if the message is a command.
        if (message.startsWith(PREFIX)) {
            // Get the command and suffix.
            const command = message.split(/[ \n]/)[0].substring(PREFIX.length).toLowerCase().trim();
            const suffix = message.substring(PREFIX.length + command.length).trim();

            logger.log(`Processed command ${command} with suffix ${suffix}`);
            // Process the commands.
            switch (command) {
                case 'play': return play(msg, suffix);
                case 'np': return np(msg);
                case 'skip': return skip(msg, suffix);
                case 'queue': return queue(msg, suffix);
                case 'pause': return pause(msg, suffix);
                case 'resume': return resume(msg, suffix);
                case 'ping': return TextHandler.pong(msg);
                case 'roll': return TextHandler.rollDice(msg);
                case 'lady': return TextHandler.cabDriver(msg);
                case 'clean': return TextHandler.cleanup(msg, suffix);
                case 'lol': return TextHandler.lol(msg);
            }
        }
    });
    /*
     * Gets a queue.
     *
     * @param server The server id.
     */
    function getQueue(server) {
        // Check if global queues are enabled.
        if (GLOBAL) server = '_'; // Change to global queue.

        // Return the queue.
        if (!queues[server]) queues[server] = [];
        return queues[server];
    }

    /*
     * Gets a queue.
     *
     * @param server The server id.
     */
    function getInfoQueue(server) {
        // Check if global queues are enabled.
        if (GLOBAL) server = '_'; // Change to global queue.

        // Return the queue.
        if (!queuesInfo[server]) queuesInfo[server] = [];
        return queuesInfo[server];
    }

    function np(msg) {
        const infoQueue = getInfoQueue(msg.guild.id);
        let voiceConnection = msg.member.voiceChannel.connection;
        if (voiceConnection === null || voiceConnection.player.dispatcher === null) {
                replyAndDelete(msg, `Nothing currently being played`);
        } else {
            if (infoQueue.length >= 1) {
                let info = infoQueue[0];
                replyAndDelete(msg, `Now Playing: ${info.title}`);
            }
        }
    }

    /*
     * Play command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function play(msg, suffix) {
        // Make sure the user is in a voice channel.
        if (msg.member.voiceChannel === undefined) {
            replyAndDelete(msg, 'You\'re not in a voice channel.');
            return;
        }

        // Make sure the suffix exists.
        if (!suffix) {
            replyAndDelete(msg, 'No video specified!');
            return;
        }

        // Get the queue.
        const videoQueue = getQueue(msg.guild.id);
        const infoQueue = getInfoQueue(msg.guild.id);

        // Check if the queue has reached its maximum size.
        if (queue.length >= MAX_QUEUE_SIZE) {
            replyAndDelete(msg, 'Maximum queue size reached!');
            return;
        }

        // Get the video information.
        msg.channel.sendMessage(wrap(`Queueing up: ${suffix}`))
        .then(response => {
            // If the suffix doesn't start with 'http', assume it's a search.
			if (!suffix.toLowerCase().startsWith('http')) {
				suffix = 'gvsearch1:' + suffix;
			}

			// Get the video info from youtube-dl.
			YoutubeDL.getInfo(suffix, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
				// Verify the info.
				if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
					return replyAndDelete(response, wrap('Invalid video!'));
                }
                
                let video = YoutubeDL(suffix, ['-q', '--no-warnings', '--force-ipv4']);

                // Queue the video.
                infoQueue.push(info);
                videoQueue.push(video);
                if (videoQueue.length == 1) {
                    // Play if only one element in the queue.
                    // console.log(msg.member);
                    let voiceChannel = msg.member.voiceChannel;
                    voiceChannel.join()
                        .then(connection => {
                            if (videoQueue.length === 1) executeQueue(msg, videoQueue, infoQueue, connection);
                        }).catch(console.error);
                } else {
                    let queueText = infoQueue.map((video) => 
                        (`${video.title}`)
                    ).join('\n');
                    replyAndDelete(msg, `Queued up ${info.title}. \n\nCurrent Queue:\n\n${queueText}`);
                }
				
            });
            response.delete(Config.deleteTimeout);
		}).catch(() => {
            response.delete(Config.deleteTimeout);
        });
    }

    /*
     * Skip command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function skip(msg, suffix) {
        // Get the voice connection.
        let voiceConnection = msg.member.voiceChannel.connection;
        if (voiceConnection === null) {
            replyAndDelete(msg, 'No music currently playing');
            return;
        }

        // Get the queue.
        const queue = getQueue(msg.guild.id);

        // Get the number to skip.
        let toSkip = 1; // Default 1.
        if (!isNaN(suffix) && parseInt(suffix) > 0) {
            toSkip = parseInt(suffix);
        }
        toSkip = Math.min(toSkip, queue.length);

        // Skip.
        queue.splice(0, toSkip - 1);

        // Resume and stop playing.
        let dispatcher = voiceConnection.player.dispatcher;
        if (voiceConnection.speaking) dispatcher.resume();
        dispatcher.end();

        replyAndDelete(msg, 'Skipped ' + toSkip + '!');
    }

    /*
     * Queue command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function queue(msg, suffix) {
        // Get the queue.
        const infoQueue = getInfoQueue(msg.guild.id);
        let queueStatus = '';
        let text = '';
        if (infoQueue.length != 0) {
            const videoInfo = infoQueue[0];
            const streamOpts = {filter : 'audioonly'};
            logger.log(`playing video ${videoInfo.title}`);

            // Get the queue text.
            text = infoQueue.map((video) => 
                (`${video.title}`)
            ).join('\n');

            // Get the status of the queue.
            let voiceConnection = msg.member.voiceChannel.connection;
            if (voiceConnection !== null) {
                let dispatcher = voiceConnection.player.dispatcher;
                if (dispatcher === null) {
                    queueStatus = 'Not playing';
                } else {
                    queueStatus = dispatcher.paused ? 'Paused' : 'Playing';
                }
            }
        } else {
            queueStatus = `Empty`;
            text = ``;
        }

        // Send the queue and status.
        replyAndDelete(msg, 'Current Queue (' + queueStatus + '):\n\n' + text, Config.deleteTimeout * 3);
    }

    /*
     * Pause command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function pause(msg, suffix) {
        // Get the voice connection.
        let voiceConnection = msg.member.voiceChannel.connection;
        if (voiceConnection === null) {
            replyAndDelete(msg, 'No music being played');
            return;
        }

        // Pause.
        let dispatcher = voiceConnection.player.dispatcher;
        if (voiceConnection.speaking) {
            logger.log(`Pausing dispatcher ${dispatcher}`);
            dispatcher.pause();
            replyAndDelete(msg, 'Playback paused', Config.deleteTimeout * 2);
        }
    }

    /*
     * Resume command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function resume(msg, suffix) {
        // Get the voice connection.
        let voiceConnection = msg.member.voiceChannel.connection;
        if (voiceConnection === null) {
            replyAndDelete(msg, 'No music being played');
            return;
        }

        // Pause.
        let dispatcher = voiceConnection.player.dispatcher;
        if (!voiceConnection.speaking) {
            logger.log(`Resuming dispatcher ${dispatcher}`);
            dispatcher.resume();
            replyAndDelete(msg, 'Playback resumed', Config.deleteTimeout * 2);
        }
    }

    /*
     * Execute the queue.
     *
     * @param msg Original message.
     * @param queue The queue.
     */
    function executeQueue(msg, queue, infoQueue, voiceConnection) {
        console.log("hello from ${voiceChannel}");
        // If the queue is empty, finish.
        if (queue.length === 0) {
            logger.log("Queue is empty, finishing");
            replyAndDelete(msg, 'Music queue finished');

            if (voiceConnection !== null || voiceConnection !== undefined) {
                voiceConnection.disconnect();
            }
            return;
        }

        new Promise((resolve, reject) => {
            logger.log(`Initiating promise for queue playing in guild: ${msg.guild}`);
            
            if (voiceConnection === undefined || voiceConnection === null) {
                logger.log(`null voiceConnection in guild ${msg.guild}`);
                reject();
            } else {
                logger.log(`voiceConnection is not null ${voiceConnection}`)
                resolve(voiceConnection);
            }
        })
        .then(connection => {
            // Get the first item in the queue.
            const video = queue[0];
            const videoInfo = infoQueue[0];
            const streamOpts = {filter : 'audioonly'};
            // console.log(connection);
            // Play the video.
            const playingInChannel = msg.member.voiceChannel.name;
            const title = videoInfo.title;
            msg.channel.sendMessage(wrap(`Now Playing: ${title} in ${playingInChannel}`))
            .then((response) => {
                logger.log(`Playing stream ${title} in connection ${playingInChannel}`);
                let dispatcher = connection.playStream(video, streamOpts)
                logger.log(`connection is playing stream`);
                setGame(client, 'in: ' + msg.member.voiceChannel.name + ', ' + videoInfo.title);
                // Catch errors in the connection.
                dispatcher.on('error', () => {
                    // Skip to the next song.
                    queue.shift();
                    reply.delete(Config.deleteTimeout);
                    msg.delete(Config.deleteTimeout);
                    executeQueue(msg, queue, connection);
                });

                // Catch the end event.
                dispatcher.on('end', () => {
                    logger.log("Song ended, executing next in queue");
                    // Wait a second.
                    setTimeout(() => {
                        // Remove the song from the queue.
                        queue.shift();
                        console.log(queue);

                        // Play the next song in the queue.
                        executeQueue(msg, queue, connection);
                    }, 1000);
                });
                response.delete(Config.deleteTimeout);
                msg.delete(Config.deleteTimeout);
            })
            .catch(console.error);
        }).catch(console.error);
    }
};

/*
 * Wrap text in a code block and escape grave characters.,
 *
 * @param text The input text.
 *
 * @return The wrapped text.
 */
function wrap(text) {
    return '```\n' + text.replace(/`/g, '`' + String.fromCharCode(8203)) + '\n```';
}

function replyAndDelete(msg, replyString, deleteTimer) {
    if (deleteTimer == null) {
        deleteTimer = Config.deleteTimeout;
    }
    msg.channel.sendMessage(wrap(replyString))
        .then(reply => {
            reply.delete(deleteTimer);
            msg.delete(deleteTimer);
        });
}
function setGame(client, status) {
    logger.log(`Setting status to ${status}`);
    logger.log(client.user.username);
    client.user.setGame("");
    client.user.setGame(status);
}

function errorGraceful(err, msg) {
    logger.error(err);
    msg.reply('Application crashed').then(response => {
        response.delete(Config.deleteTimeout);
        msg.delete(Config.deleteTimeout);
    })
    msg.delete(Config.deleteTimeout);
}
