var base = "/";

module.exports.set = function(app) {
	app.get(base, function(req, res) {
		res.send('Hello, world!');
	});
}



