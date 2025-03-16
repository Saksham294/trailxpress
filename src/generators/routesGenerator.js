const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

function parseFile(apiFilePath) {
  let apiCode;
  try {
    apiCode = fs.readFileSync(apiFilePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${apiFilePath}: ${error.message}`);
  }

  try {
    return babelParser.parse(apiCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'dynamicImport'],
    });
  } catch (error) {
    throw new Error(`Failed to parse file ${apiFilePath}: ${error.message}`);
  }
}

function getRouter(apiAst) {
  let routerVariableName;
  traverse(apiAst, {
    VariableDeclaration(varPath) {
      varPath.get('declarations').forEach((declaration) => {
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
  const apiAst = parseFile(apiFilePath);
  const routerVariableName = getRouter(apiAst);

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

  const functionDefinitions = {};
  functionFilePaths.forEach(filePath => {
    try {
      const functionsAst = parseFile(filePath);
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

  const routes = [];
  traverse(apiAst, {
    CallExpression(callPath) {
      if (
        callPath.get('callee').isMemberExpression() &&
        callPath.get('callee.object').isIdentifier({ name: routerVariableName })
      ) {
        const method = callPath.get('callee.property').node.name.toUpperCase();
        const args = callPath.get('arguments');
        const routePath = args[0].node.value;

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
        } else if (args.length > 2) {
          let middlewares = [];
          for (let i = 1; i < args.length - 1; i++) {
            middlewares.push(generate(args[i].node).code);
          }
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

  return filterMethods.length > 0
    ? routes.filter(route => filterMethods.includes(route.method))
    : routes;
}

module.exports = { getRoutes };
