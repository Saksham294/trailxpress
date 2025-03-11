const { getRoutes } = require("./src/parser");
const { generateSwagger } = require("./src/swaggerDocGen");
const { generatePostmanCollection } = require("./src/postman");

module.exports = { getRoutes, generateSwagger,generatePostmanCollection };
