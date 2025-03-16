const routesGenerator = require('../../generators/routesGenerator');
const swaggerGenerator = require('../../generators/swaggerGenerator');

function generateSwagger(apiFilePath, save, format) {
  try {
    const routes = routesGenerator.getRoutes(apiFilePath);
    const swaggerSpec = swaggerGenerator.generateSwagger(routes, save, format);
  } catch (error) {
    console.error('Error generating Swagger spec:', error.message);
  }
}

module.exports = generateSwagger;
