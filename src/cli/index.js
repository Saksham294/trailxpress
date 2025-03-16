const { program } = require('commander');
const fs = require('fs');
const generateRoutes = require('./commands/generateRoutes');
const generateSwagger = require('./commands/generateSwagger');
const generatePostman = require('./commands/generatePostman');

program
  .version('1.0.0')
  .description('TrailXpress CLI: Generate Routes, Swagger Docs, and Postman Collections');

program
  .command('extract')
  .description('Extract routes from API')
  .option('-f, --file <file>', 'API file to parse', 'api.js')
  .option('-m, --methods <methods>', 'Comma separated HTTP methods to filter', '')
  .action((options) => {
    generateRoutes(options.file, options.methods);
  });

program
  .command('swagger')
  .description('Generate Swagger documentation')
  .option('-f, --file <file>', 'API file to parse', 'api.js')
  .option('-s, --save', 'Save output to file', false)
  .option('-F, --format <format>', 'Output format: json or yaml', 'json')
  .action((options) => {
    generateSwagger(options.file, options.save, options.format);
  });

  program
  .command('postman')
  .description('Generate Postman collection')
  .option('-f, --file <file>', 'API file to parse', 'api.js')
  .option('-c, --config <config>', 'Path to JSON/YAML config file')
  .option('-s, --save', 'Save output to file', false)
  .action((options) => {
    let userConfig = {};

    if (options.config) {
      const path = require('path');

      const configPath = path.resolve(options.config);
      if (fs.existsSync(configPath)) {
        userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } else {
        console.error(`⚠️ Config file not found: ${configPath}`);
        process.exit(1);
      }
    }

    const finalConfig = {
      name: 'API Documentation',
      description: '',
      baseUrl: 'http://localhost:3000',
      version: '2.1.0',
      save: options.save,
      ...userConfig,
    };
    
    generatePostman(options.file, finalConfig);
  });

program.parse(process.argv);
