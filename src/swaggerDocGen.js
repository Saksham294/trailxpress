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

function generateSwagger(routes, config = {}) {
  const defaultConfig = {
    save: false,
    format: 'json',
    outputPath: 'swagger',
    title: 'API Documentation',
    version: '1.0.0',
    description: 'This is the API documentation for the application.',
    contact: {
      name: 'API Support',
      url: 'http://www.your-organisation.com/support',
      email: 'support@your-organisation.com'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server'
      }
    ]
  };

  const finalConfig = { ...defaultConfig, ...config };
  const swaggerSpec = generateSwaggerSpec(routes, finalConfig);

  if (finalConfig.save) {
    saveSwaggerFile(swaggerSpec, finalConfig.format, finalConfig.outputPath);
  }

  return swaggerSpec; // Return spec for in-memory use
}

function generateSwaggerSpec(routes, config) {
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: config.title,
      version: config.version,
      description: config.description,
      contact: config.contact,
    },
    servers: config.servers,
    paths: {},
  };

  routes.forEach(route => {
    const { method, path, middleware } = route;
    const formattedPath = path.replace(/:([^/]+)/g, '{$1}');

    if (!swaggerSpec.paths[formattedPath]) {
      swaggerSpec.paths[formattedPath] = {};
    }

    swaggerSpec.paths[formattedPath][method.toLowerCase()] = {
      summary: `Handler for ${method.toUpperCase()} ${path}`,
      parameters: extractParameters(path),
      responses: {
        200: { description: 'Success' },
        400: { description: 'Bad request' },
        500: { description: 'Internal server error' }
      },
    };

    if (middleware && middleware.length > 0) {
      swaggerSpec.paths[formattedPath][method].description = `Middleware:\n${middleware.map(mw => `- ${mw.name || 'anonymous'}`).join('\n')}`;
    }
  });

  return swaggerSpec;
}

function extractParameters(path) {
  const parameters = [];
  const paramRegex = /:([^/]+)/g;
  let match;

  while ((match = paramRegex.exec(path)) !== null) {
    parameters.push({
      name: match[1],
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      },
      description: `Parameter: ${match[1]}`
    });
  }

  return parameters;
}

module.exports = { generateSwagger };
