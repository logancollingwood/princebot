const YoutubeDL = require('ytdl-core');
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
    let isAvatarSet = false;

    // Catch message events.
    client.on('message', msg => {
        if(msg.author.bot) return;
        if (!isAvatarSet) {
            logger.log("Setting up the prince icon");
            client.user.setAvatar('static/prince.jpg')
            .then(isAvatarSet = true);
        }

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
     * Play command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function play(msg, suffix) {
        // Make sure the user is in a voice channel.
        if (msg.author.voiceChannel === null) {
            replyAndDelete(msg, 'You\'re not in a voice channel.');
            return;
        }

        // Make sure the suffix exists.
        if (!suffix) {
            replyAndDelete(msg, 'No video specified!');
            return;
        }

        // Get the queue.
        const queue = getQueue(msg.guild.id);

        // Check if the queue has reached its maximum size.
        if (queue.length >= MAX_QUEUE_SIZE) {
            replyAndDelete(msg, 'Maximum queue size reached!');
            return;
        }

        // Get the video information.
        msg.channel.sendMessage(wrap('Searching for ' + suffix))
        .then(response => {
            // If the suffix doesn't start with 'http', assume it's a search.
            if (!suffix.toLowerCase().startsWith('http')) {
                suffix = 'gvsearch1:' + suffix;
            }
            logger.log(`suffix + ${suffix}`);
            let video = YoutubeDL(suffix);
            video.on('error', error => {
                return response.edit(wrap('Invalid video!'))
                        .then(response => {
                            response.delete(Config.deleteTimeout);
                            msg.delete(Config.deleteTimeout);
                        });
            });

            video.on('info', info => {
                // Queue the video.
                response.edit(wrap('Queued: ' + info.title)).then(() => {
                    logger.log(`url enqueued ${info.url}`);
                    queue.push({'stream': video, 'info': info});
                    logger.log(client.voiceConnections);

                    // Play if only one element in the queue.
                    if (queue.length === 1) {
                        logger.log("executing queue");
                        executeQueue(msg, queue, null);
                    }
                    response.delete(Config.deleteTimeout);
                }).catch(() => {});
            });
            response.delete(Config.deleteTimeout).catch(err => errorGraceful(err, msg));
            msg.delete(Config.deleteTimeout).catch(err => errorGraceful(err, msg));
        })
        .catch(err => errorGraceful(err, msg));
    }

    /*
     * Skip command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function skip(msg, suffix) {
        // Get the voice connection.
        let voiceConnection = msg.member.voiceChannel;
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
        const queue = getQueue(msg.guild.id);
        let queueStatus = '';
        let text = '';
        if (queue.length != 0) {
            const video = queue[0];
            const stream = video.stream;
            const info = video.info;
            const streamOpts = {filter : 'audioonly'};
            logger.log(`playing video ${info.title} by ${info.author}`);
            
            // Get the queue text.
            text = queue.map((video) => 
                (`${video.info.title} by ${video.info.author}`)
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
        replyAndDelete(msg, 'Queue (' + queueStatus + '):\n' + text, Config.deleteTimeout * 3);
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
    function executeQueue(msg, queue, voiceConnection) {
        logger.log(voiceConnection);
        // If the queue is empty, finish.
        if (queue.length === 0) {
            logger.log("Queue is empty, finishing");
            replyAndDelete(msg, 'Music queue finished');

            if (voiceConnection !== null) {
                voiceConnection.disconnect();
            }
            return;
        }

        new Promise((resolve, reject) => {
            logger.log(`Initiating promise for queue playing in guild: ${msg.guild}`);

           
            if (voiceConnection === null) {
                logger.log(`null voiceConnection in guild ${msg.guild}`);
                let vc = msg.member.voiceChannel;
                logger.log(`user in vc ${vc}`);
                // Check if the user is in a voice channel.
                if (vc) {
                    logger.log(`attempting to join vc ${vc}`)
                    vc.join()
                        .then(connection => {
                            logger.log(`joined vc ${vc}`);
                            resolve(connection);
                        }).catch(console.error);
                } else {
                    logger.log(`unable to join vc ${vc}`);
                    // Otherwise, clear the queue and do nothing.
                    queue.splice(0, queue.length);
                    replyAndDelete(msg, "You are no longer in a voice channel");
                    reject();
                }
            } else {
                logger.log(`voiceConnection is not null ${voiceConnection}`)
                resolve(voiceConnection);
            }
        })
        .then(connection => {
            // Get the first item in the queue.
            const video = queue[0];
            const stream = video.stream;
            const info = video.info;
            const streamOpts = {filter : 'audioonly'};
            logger.log(`playing video ${info} by ${info.author}`);
            // Play the video.
            msg.channel.sendMessage(wrap('Now Playing: ' + info.title + ' in ' + connection.channel.name))
            .then((response) => {
                logger.log(`Playing stream ${info.title} in connection ${connection.channel.name}`);
                let dispatcher = connection.playStream(stream, streamOpts)
                logger.log(`connection is playing stream`);
                setGame(client, 'in: ' + connection.channel.name + ', ' + info.title);
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
    }).catch(errorGraceful(err, msg));
    msg.delete(Config.deleteTimeout);
}