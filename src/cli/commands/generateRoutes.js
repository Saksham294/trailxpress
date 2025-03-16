const routesGenerator = require('../../generators/routesGenerator');

function generateRoutes(apiFilePath, methods) {
  try {
    const filterMethods = methods ? methods.split(',').map(m => m.trim().toUpperCase()) : [];
    const routes = routesGenerator.getRoutes(apiFilePath, filterMethods);
  } catch (error) {
    console.error('Error generating routes:', error.message);
  }
}

module.exports = generateRoutes;
