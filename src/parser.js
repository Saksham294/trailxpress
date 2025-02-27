const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

function getRouter(apiFilePath) {
  let apiCode;
  try {
    apiCode = fs.readFileSync(apiFilePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${apiFilePath}: ${error.message}`);
  }

  let apiAst;
  try {
    apiAst = babelParser.parse(apiCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'dynamicImport'],
    });
  } catch (error) {
    throw new Error(`Failed to parse file ${apiFilePath}: ${error.message}`);
  }

  let routerVariableName;
  traverse(apiAst, {
    VariableDeclaration(varPath) {
      const declarations = varPath.get('declarations');
      declarations.forEach((declaration) => {
        if (
          declaration.get('init').isCallExpression() &&
          declaration.get('init.callee').isMemberExpression() &&
          declaration.get('init.callee.property').isIdentifier({ name: 'Router' })
        ) {
          routerVariableName = declaration.get('id').node.name;
        }
      });
    }
  });

  return routerVariableName;
}

function getRoutes(apiFilePath, filterMethods = []) {
  let apiCode;
  try {
    apiCode = fs.readFileSync(apiFilePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${apiFilePath}: ${error.message}`);
  }
  let apiAst;
  try {
    apiAst = babelParser.parse(apiCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'dynamicImport'],
    });
  } catch (error) {
    throw new Error(`Failed to parse file ${apiFilePath}: ${error.message}`);
  }

  // Gather function file paths from ImportDeclarations
  const functionFilePaths = [];
  traverse(apiAst, {
    ImportDeclaration(importPath) {
      const importSource = importPath.node.source.value;
      if (importSource.startsWith('.')) {
        const absolutePath = path.resolve(path.dirname(apiFilePath), importSource);
        functionFilePaths.push(absolutePath);
      }
    }
  });

  // Build function definitions from imported files
  const functionDefinitions = {};
  functionFilePaths.forEach(filePath => {
    try {
      const functionsCode = fs.readFileSync(filePath, 'utf-8');
      const functionsAst = babelParser.parse(functionsCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'dynamicImport'],
      });
      traverse(functionsAst, {
        ExportNamedDeclaration(exportPath) {
          if (exportPath.node.declaration?.type === 'FunctionDeclaration') {
            const functionName = exportPath.node.declaration.id.name;
            functionDefinitions[functionName] = generate(exportPath.node.declaration).code;
          } else if (exportPath.node.declaration?.type === 'VariableDeclaration') {
            exportPath.node.declaration.declarations.forEach((declaration) => {
              if (
                declaration.id &&
                declaration.init &&
                (declaration.init.type === 'ArrowFunctionExpression' || declaration.init.type === 'FunctionExpression')
              ) {
                functionDefinitions[declaration.id.name] = generate(declaration.init).code;
              }
            });
          }
        },
      });
    } catch (error) {
      console.error(`Failed to process file ${filePath}:`, error.message);
    }
  });

  // Extract imported functions from API file
  const importedFunctions = {};
  traverse(apiAst, {
    ImportDeclaration(importPath) {
      importPath.node.specifiers.forEach((specifier) => {
        if (specifier.type === 'ImportSpecifier') {
          const importedName = specifier.imported.name;
          const localName = specifier.local.name;
          importedFunctions[localName] = functionDefinitions[importedName];
        }
      });
    }
  });

  const routerVariableName = getRouter(apiFilePath);
  const routes = [];

  // Traverse API AST to extract routes with middleware and handler
  traverse(apiAst, {
    CallExpression(callPath) {
      if (
        callPath.get('callee').isMemberExpression() &&
        callPath.get('callee.object').isIdentifier({ name: routerVariableName })
      ) {
        const method = callPath.get('callee.property').node.name.toUpperCase();
        const args = callPath.get('arguments');
        const routePath = args[0].node.value;

        // If only one function is passed after the path, treat it as the handler.
        if (args.length === 2) {
          const routeFunctionNode = args[1];
          let handlerCode = '';
          if (routeFunctionNode.isIdentifier()) {
            const functionName = routeFunctionNode.node.name;
            handlerCode = importedFunctions[functionName] || functionDefinitions[functionName] || '';
          } else if (routeFunctionNode.isArrowFunctionExpression() || routeFunctionNode.isFunctionExpression()) {
            handlerCode = generate(routeFunctionNode.node).code;
          }
          routes.push({ method, path: routePath, middlewares: [], handler: handlerCode });
        }
        // If more than one function is passed, extract middleware and handler
        else if (args.length > 2) {
          let middlewares = [];
          // All functions except the first (path) and last (handler) are middlewares.
          for (let i = 1; i < args.length - 1; i++) {
            const middlewareCode = generate(args[i].node).code;
            middlewares.push(middlewareCode);
          }
          // The final function is the handler.
          let handlerCode = '';
          const handlerNode = args[args.length - 1];
          if (handlerNode.isIdentifier()) {
            const functionName = handlerNode.node.name;
            handlerCode = importedFunctions[functionName] || functionDefinitions[functionName] || '';
          } else if (handlerNode.isArrowFunctionExpression() || handlerNode.isFunctionExpression()) {
            handlerCode = generate(handlerNode.node).code;
          }
          routes.push({ method, path: routePath, middlewares, handler: handlerCode });
        }
      }
    }
  });

  // Filter routes by methods if filterMethods is provided.
  return filterMethods.length > 0 ? routes.filter(route => filterMethods.includes(route.method)) : routes;
}


module.exports = { getRouter, getRoutes };
