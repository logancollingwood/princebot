const apiBase = '/api/v1/';

module.exports.set = function(app) {
	app.get(apiBase + 'doc', function(req, res) {
		res.send('Hello, world!');
	});

	app.get(apiBase + 'connect/:inviteLink', function(req,res) {
	   res.send(req.params);
    	});
}
