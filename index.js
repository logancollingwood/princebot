"use strict";
require('babel-register')({
    retainLines: true
});
let LOGGER = require("./util/logger");
console.log(require('./config'));


let musicBot = require('./bot/bot');

musicBot.init();

const express = require('express');
const app = express();

const controllers = require('./controllers');
controllers.set(app);

app.listen(3000, function () {
    LOGGER.log("Princebot listening on 3000");
});
