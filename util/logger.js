let LOGGER_PREFIX = "	prince: ";

exports.log = function(msg) {
	console.log(LOGGER_PREFIX + msg);
}

exports.error = function(msg) {
	console.error(LOGGER_PREFIX + msg);
}