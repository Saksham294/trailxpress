const routesGenerator = require('./generators/routesGenerator');
const swaggerGenerator = require('./generators/swaggerGenerator');
const postmanGenerator = require('./generators/postmanGenerator');

module.exports = {
  getRoutes: routesGenerator.getRoutes,
  generateSwagger: swaggerGenerator.generateSwagger,
  generatePostmanCollection: postmanGenerator.generatePostmanCollection,
};
