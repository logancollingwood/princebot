require('babel-register');
require('./bot/bot');
const express = require('express');
const app = express();

const controllers = require('./controllers');
controllers.set(app);

app.listen(3000, function () {
    console.log("Princebot listening on 3000");
});
