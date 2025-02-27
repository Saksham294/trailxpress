const { getRouter, getRoutes } = require("./src/parser");
const { generateSwagger } = require("./src/swaggerDocGen");

module.exports = { getRouter, getRoutes, generateSwagger };
