const Config = require('../config');

exports.parseContent = function(content) {
    let indexOfSpace = content.indexOf(" ");
    let command = "";
    let args = [];
    if (indexOfSpace == -1) { // no space, command is just !COMMAND
        command = content.replace(Config.prefix, "").toLowerCase();
    } else { // space, so command is !COMMAND args
        command = content.substring(content.lastIndexOf("!")+1, content.indexOf(" ")).toLowerCase();
        args = content.replace(Config.prefix + command + " ", "");
        args = args.split(" ");
    }

    return {
        "content" : content,
        "command" : command,
        "args": args
    }
};

exports.isDefined = function(obj) {
    if ( typeof obj !== 'undefined' && obj )
    {
      return true;
    }
    return false
}
