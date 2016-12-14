const apiRoutes = require('./api/routes.js');
const webRoutes = require('./web/routes.js');

module.exports.set = function(app) {
	apiRoutes.set(app);
	webRoutes.set(app);
};
