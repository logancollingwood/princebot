require('babel-register');
require('./bot/bot');

const express = require('express');
const app = express();

const controllers = require('./controllers');
controllers.set(app);

app.listen(3000, function () {
    console.log("Princebot listening on 3000");
});
let https = require('https');

//cert sanity check
https.get('https://us-west265.discord.gg/', function(res) {
    console.log('statusCode: ', res.statusCode);

    res.on('data', function(d) {
        process.stdout.write(d);
    });
});