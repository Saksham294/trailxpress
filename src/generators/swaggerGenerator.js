const fs = require('fs');
const yaml = require('js-yaml');

function saveSwaggerFile(swaggerSpec, format = 'json', outputPath = 'swagger') {
  try {
    if (format === 'yaml') {
      const yamlData = yaml.dump(swaggerSpec);
      fs.writeFileSync(`${outputPath}.yaml`, yamlData, 'utf-8');
      console.log(`✅ Swagger spec saved as ${outputPath}.yaml`);
    } else {
      fs.writeFileSync(`${outputPath}.json`, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
      console.log(`✅ Swagger spec saved as ${outputPath}.json`);
    }
  } catch (error) {
    console.error(`❌ Failed to save Swagger file: ${error.message}`);
  }
}

function generateSwagger(routes, save = false, format = 'json') {
  const swaggerSpec = generateSwaggerSpec(routes);

  if (save) {
    saveSwaggerFile(swaggerSpec, format);
  }

  return swaggerSpec;
}

function generateSwaggerSpec(routes) {
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
    paths: {},
  };

  routes.forEach(({ method, path }) => {
    if (!swaggerSpec.paths[path]) {
      swaggerSpec.paths[path] = {};
    }
    swaggerSpec.paths[path][method.toLowerCase()] = {
      summary: `Handler for ${method.toUpperCase()} ${path}`,
      responses: {
        200: { description: 'Success' },
        400: { description: 'Bad request' },
        500: { description: 'Internal server error' }
      },
    };
  });

  return swaggerSpec;
}

module.exports = { generateSwagger };
