const apiRoutes = require('./api.js');
const webRoutes = require('./web/routes.js');

module.exports.set = function(app) {
	apiRoutes.set(app);
	webRoutes.set(app);
};
