const routesGenerator = require('../../generators/routesGenerator');
const postmanGenerator = require('../../generators/postmanGenerator');

async function generatePostman(apiFilePath, config) {
  try {
    const routes = routesGenerator.getRoutes(apiFilePath);
    const collection = await postmanGenerator.generatePostmanCollection(routes,config);
  } catch (error) {
    console.error('Error generating Postman collection:', error.message);
  }
}

module.exports = generatePostman;