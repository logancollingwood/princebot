"use strict";
require('babel-register');


let musicBot = require('./bot/bot');

musicBot.init();

const express = require('express');
const app = express();

const controllers = require('./controllers');
controllers.set(app);

app.listen(3000, function () {
    console.log("Princebot listening on 3000");
    console.log("CONFIG");
    console.log(require('./config'));
});
