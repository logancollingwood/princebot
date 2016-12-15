const YoutubeDL = require('ytdl-core');
const Request = require('request');
const Config = require('../../../config');

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

    // Create an object of queues.
    let queues = {};

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

            // Process the commands.
            switch (command) {
                case 'play': return play(msg, suffix);
                case 'skip': return skip(msg, suffix);
                case 'queue': return queue(msg, suffix);
                case 'pause': return pause(msg, suffix);
                case 'resume': return resume(msg, suffix);
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
        msg.reply(wrap('Searching...')).then(response => {
            // If the suffix doesn't start with 'http', assume it's a search.
            if (!suffix.toLowerCase().startsWith('http')) {
                suffix = 'gvsearch1:' + suffix;
            }

            // Get the video info from youtube-dl.
            YoutubeDL.getInfo(suffix, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
                // Verify the info.
                if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
                    return response.edit(wrap('Invalid video!'))
                        .then(response => {
                            response.delete(Config.deleteTimeout);
                            msg.delete(Config.deleteTimeout);
                        });
                }

                // Queue the video.
                response.edit(wrap('Queued: ' + info.title)).then(() => {
                    queue.push(info);

                    // Play if only one element in the queue.
                    if (queue.length === 1) executeQueue(msg, queue);
                }).catch(() => {});
            });
        }).catch(() => {});
    }

    /*
     * Skip command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function skip(msg, suffix) {
        // Get the voice connection.
        const voiceConnection = client.voiceConnections.get('server', msg.guild);
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

        // Get the queue text.
        const text = queue.map((video, index) => (
            (index + 1) + ': ' + video.title
        )).join('\n');

        // Get the status of the queue.
        let queueStatus = 'Stopped';
        const voiceConnection = client.voiceConnections.get('server', msg.guild.id);
        if (voiceConnection !== null) {
            let dispatcher = voiceConnection.player.dispatcher;
            queueStatus = dispatcher.paused ? 'Paused' : 'Playing';
        }

        // Send the queue and status.
        replyAndDelete(msg, 'Queue (' + queueStatus + '):\n' + text);
    }

    /*
     * Pause command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function pause(msg, suffix) {
        // Get the voice connection.
        const voiceConnection = client.voiceConnections.get('server', msg.guild.id);
        if (voiceConnection === null) {
            replyAndDelete(msg, 'No music being played');
            return;
        }

        // Pause.
        replyAndDelete(msg, 'Playback paused');
        let dispatcher = voiceConnection.player.dispatcher;
        if (voiceConnection.speaking) dispatcher.pause();
    }

    /*
     * Resume command.
     *
     * @param msg Original message.
     * @param suffix Command suffix.
     */
    function resume(msg, suffix) {
        // Get the voice connection.
        const voiceConnection = client.voiceConnections.get('server', msg.server);
        if (voiceConnection === null) {
            replyAndDelete(msg, 'No music being played');
            return;
        }

        // Resume.
        replyAndDelete(msg, 'Playback resumed');
        let dispatcher = voiceConnection.player.dispatcher;
        if (voiceConnection.speaking) dispatcher.resume();
    }

    /*
     * Execute the queue.
     *
     * @param msg Original message.
     * @param queue The queue.
     */
    function executeQueue(msg, queue) {
        // If the queue is empty, finish.
        if (queue.length === 0) {
            replyAndDelete(msg, 'Music queue finished');

            // Leave the voice channel.
            const voiceConnection = client.voiceConnections.get('server', msg.guild);
            if (voiceConnection !== null) {
                voiceConnection.disconnect();
            }
        }

        new Promise((resolve, reject) => {
            // Join the voice channel if not already in one.
            const voiceConnection = client.voiceConnections.get('server', msg.guild);
            if (voiceConnection === null) {
                let vc = msg.member.voiceChannel;
                // Check if the user is in a voice channel.
                if (vc) {
                    vc.join.then(connection => {
                        resolve(connection);
                    }).catch(() => {});
                } else {
                    // Otherwise, clear the queue and do nothing.
                    queue.splice(0, queue.length);
                    replyAndDelete(msg, "You are no longer in a voice channel");
                    reject();
                }
            } else {
                resolve(voiceConnection);
            }
        })
        .then(connection => {
            // Get the first item in the queue.
            const video = queue[0];
            const streamOpts = {filter : 'audioonly'};
            // Play the video.
            msg.reply(msg, wrap('Now Playing: ' + video.title))
                .then(() => {
                    connection.playStream(Request(video.url), streamOpts).then(intent => {
                        // Catch errors in the connection.
                        connection.player.dispatcher.on('error', () => {
                            // Skip to the next song.
                            queue.shift();
                            executeQueue(msg, queue);
                        });
                        connection.player.dispatcher.on('error', () => {
                            // Skip to the next song.
                            queue.shift();
                            executeQueue(msg, queue);
                        });

                        // Catch all errors.
                        intent.on('error', () => {
                            // Skip to the next song.
                            queue.shift();
                            executeQueue(msg, queue);
                        });

                        // Catch the end event.
                        intent.on('end', () => {
                            // Wait a second.
                            setTimeout(() => {
                                // Remove the song from the queue.
                                queue.shift();

                                // Play the next song in the queue.
                                executeQueue(msg, queue);
                            }, 1000);
                        });
                    }).catch(() => {});
                })
                .then(reply => {
                    reply.delete(Config.deleteTimeout);
                    msg.delete(Config.deleteTimeout);
                })
                .catch(() => {});
        })
        .catch(() => {});
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

function replyAndDelete(msg, replyString) {
    msg.reply(wrap(replyString))
        .then(reply => {
            reply.delete(Config.deleteTimeout);
            msg.delete(Config.deleteTimeout);
        });
}