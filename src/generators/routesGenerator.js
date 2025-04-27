const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const astCache = new Map();
function parseFile(filePath) {
  if (astCache.has(filePath)) return astCache.get(filePath);
  let code;
  try {
    code = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read file ${filePath}: ${err.message}`);
  }
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'dynamicImport'],
  });
  astCache.set(filePath, ast);
  return ast;
}

function getExpressInstances(ast) {
  let routerName;
  let appName;
  traverse(ast, {
    VariableDeclarator({ node }) {
      const { id, init } = node;
      if (!init) return;
      if (
        init.type === 'CallExpression' &&
        init.callee.type === 'MemberExpression' &&
        init.callee.object.name === 'express' &&
        init.callee.property.name === 'Router'
      ) {
        routerName = id.name;
      }
      if (
        init.type === 'CallExpression' &&
        init.callee.type === 'Identifier' &&
        init.callee.name === 'express'
      ) {
        appName = id.name;
      }
    }
  });
  return { routerName, appName };
}

function extractRoutesAndMounts(ast, routerName, appName) {
  const routes = [];
  const mounts = [];
  traverse(ast, {
    CallExpression(callPath) {
      const callee = callPath.get('callee');
      if (!callee.isMemberExpression()) return;
      const obj = callee.get('object');
      if (!(
        (routerName && obj.isIdentifier({ name: routerName })) ||
        (appName && obj.isIdentifier({ name: appName }))
      )) return;

      const method = callee.get('property').node.name.toUpperCase();
      const args = callPath.get('arguments');
      if (method === 'USE' && args.length === 2 && args[0].isStringLiteral() && args[1].isIdentifier()) {
        mounts.push({ prefix: args[0].node.value, routerName: args[1].node.name });
        return;
      }
      if (method !== 'USE') {
        const routePath = args[0].node.value;
        const middlewares = [];
        for (let i = 1; i < args.length - 1; i++) {
          middlewares.push(generate(args[i].node).code);
        }
        const last = args[args.length - 1];
        let handlerName = '';
        let handlerCode = '';
        if (last.isIdentifier()) {
          handlerName = last.node.name;
          handlerCode = handlerName;
        } else {
          handlerCode = generate(last.node).code;
        }
        routes.push({ method, path: routePath, middlewares, handlerName, handlerCode });
      }
    }
  });
  return { routes, mounts };
}

function collectHandlerDefinitions(ast, baseDir) {
  const handlerModules = {};

  traverse(ast, {
    VariableDeclarator({ node }) {
      const { id, init } = node;
      if (init && init.type === 'CallExpression' && init.callee.name === 'require') {
        const reqPath = init.arguments[0] && init.arguments[0].value;
        if (reqPath && reqPath.startsWith('.')) {
          const absPath = require.resolve(path.resolve(baseDir, reqPath));
          if (id.type === 'ObjectPattern') {
            id.properties.forEach(prop => {
              if (prop.key && prop.key.name) handlerModules[prop.key.name] = absPath;
            });
          } else if (id.type === 'Identifier') {
            handlerModules[id.name] = absPath;
          }
        }
      }
    },
    ImportDeclaration({ node }) {
      const src = node.source.value;
      if (src.startsWith('.')) {
        const absPath = require.resolve(path.resolve(baseDir, src));
        node.specifiers.forEach(spec => {
          if (spec.type === 'ImportSpecifier' && spec.local && spec.local.name) {
            handlerModules[spec.local.name] = absPath;
          }
        });
      }
    }
  });


  const fileToNames = {};
  for (const [name, filePath] of Object.entries(handlerModules)) {
    fileToNames[filePath] = fileToNames[filePath] || new Set();
    fileToNames[filePath].add(name);
  }

  const defs = {};
  Object.entries(fileToNames).forEach(([filePath, namesSet]) => {
    const names = Array.from(namesSet);
    let childAst;
    try {
      childAst = parseFile(filePath);
    } catch (err) {
      names.forEach(n => defs[n] = '');
      return;
    }
    traverse(childAst, {
      FunctionDeclaration(path) {
        const id = path.node.id;
        if (id && namesSet.has(id.name)) {
          defs[id.name] = generate(path.node).code;
        }
      },
      VariableDeclarator(path) {
        const { id, init } = path.node;
        if (id.type === 'Identifier' && namesSet.has(id.name) && init && ['FunctionExpression','ArrowFunctionExpression'].includes(init.type)) {
          defs[id.name] = generate(init).code;
        }
      },
      AssignmentExpression(path) {
        const { node } = path;
        if (node.left.type === 'MemberExpression') {
          const obj = node.left.object;
          const prop = node.left.property;
          const name = prop.name;
          if (namesSet.has(name) && (obj.name === 'exports' ||
              (obj.type === 'MemberExpression' && obj.object.name === 'module' && obj.property.name === 'exports'))
          ) {
            if (['FunctionExpression','ArrowFunctionExpression'].includes(node.right.type)) {
              defs[name] = generate(node.right).code;
            }
          }
        }
      }
    });
    names.forEach(n => { if (!defs[n]) defs[n] = ''; });
  });

  return defs;
}

function getRoutesFromFile(filePath, filterMethods = []) {
  const ast = parseFile(filePath);
  const { routerName, appName } = getExpressInstances(ast);
  const handlerDefs = collectHandlerDefinitions(ast, path.dirname(filePath));
  const { routes } = extractRoutesAndMounts(ast, routerName, appName);
  return routes.map(r => ({
    method: r.method,
    path: r.path,
    middlewares: r.middlewares,
    handlerName: r.handlerName,
    handlerCode: handlerDefs[r.handlerName] || r.handlerCode
  })).filter(r => 
    filterMethods.length 
      ? filterMethods.map(m => m.toUpperCase()).includes(r.method)
      : true
  );
}

function getRoutes(appFilePath, filterMethods = []) {
  const ast = parseFile(appFilePath);
  const { routerName, appName } = getExpressInstances(ast);
  const moduleMap = {};
  const cwd = path.dirname(appFilePath);

  traverse(ast, {
    ImportDeclaration({ node }) {
      if (node.source.value.startsWith('.')) {
        const abs = require.resolve(path.resolve(cwd, node.source.value));
        node.specifiers.forEach(spec => moduleMap[spec.local.name] = abs);
      }
    },
    VariableDeclarator({ node }) {
      const { id, init } = node;
      if (init && init.type==='CallExpression' && init.callee.name==='require') {
        const src = init.arguments[0] && init.arguments[0].value;
        if (src && src.startsWith('.')) {
          const abs = require.resolve(path.resolve(cwd, src));
          if (id.type==='Identifier') moduleMap[id.name] = abs;
        }
      }
    }
  });

  const { routes: topRoutes, mounts } = extractRoutesAndMounts(ast, routerName, appName);
  const all = [...topRoutes];

  mounts.forEach(({ prefix, routerName: rn }) => {
    const modPath = moduleMap[rn];
    if (!modPath) return;
    getRoutesFromFile(modPath, filterMethods).forEach(r => all.push({ ...r, path: `${prefix}${r.path}` }));
  });

  return all;
}

module.exports = { getRoutes };
