const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

function getRouterAndRoutes(apiFilePath) {
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
    let functionsCode;
    try {
      functionsCode = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error.message);
      return;
    }

    let functionsAst;
    try {
      functionsAst = babelParser.parse(functionsCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'dynamicImport'],
      });
    } catch (error) {
      console.error(`Failed to parse file ${filePath}:`, error.message);
      return;
    }

    traverse(functionsAst, {
      ExportNamedDeclaration(exportPath) {
        if (exportPath.node.declaration && exportPath.node.declaration.type === 'FunctionDeclaration') {
          const functionName = exportPath.node.declaration.id.name;
          const functionCode = extractFunctionCode(exportPath.node.declaration);
          functionDefinitions[functionName] = functionCode;
        } else if (exportPath.node.declaration && exportPath.node.declaration.type === 'VariableDeclaration') {
          const declarations = exportPath.node.declaration.declarations;
          declarations.forEach((declaration) => {
            if (declaration.id && declaration.init && (declaration.init.type === 'ArrowFunctionExpression' || declaration.init.type === 'FunctionExpression')) {
              const functionName = declaration.id.name;
              const functionCode = extractFunctionCode(declaration.init);
              functionDefinitions[functionName] = functionCode;
            }
          });
        }
      },
    });
  });

  let routerVariableName;
  const routes = [];

  function extractFunctionCode(node) {
    return generate(node).code;
  }

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
    },
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
    },
    CallExpression(callPath) {
      if (
        callPath.get('callee').isMemberExpression() &&
        callPath.get('callee.object').isIdentifier({ name: routerVariableName })
      ) {
        const method = callPath.get('callee.property').node.name;
        const routePath = callPath.get('arguments.0').node.value;
        const routeFunctionNode = callPath.get('arguments.1');

        if (routeFunctionNode.isIdentifier()) {
          const functionName = routeFunctionNode.node.name;
          const routeFunctionCode = importedFunctions[functionName] || functionDefinitions[functionName];
          if (routeFunctionCode) {
            routes.push({ method, path: routePath, functionCode: routeFunctionCode });
          }
        } else if (routeFunctionNode.isArrowFunctionExpression() || routeFunctionNode.isFunctionExpression()) {
          const routeFunctionCode = extractFunctionCode(routeFunctionNode.node);
          routes.push({ method, path: routePath, functionCode: routeFunctionCode });
        }
      }
    },
  });

  return { routerVariableName, routes };
}

module.exports = {
    getRouterAndRoutes,
  };
