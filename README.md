# Routes Explorer

Parse your Express API and find various route details like HTTP method, paths and function bodies"

## Installation

```bash
npm install routes-explorer
```

# Features

- Automatically extract route details from your Express application.
- Retrieves HTTP methods, paths, and function bodies from your Express API.
- Handles different function types used in route definitions.

# Usage
To use this package, include it in your Node.js project and call the getRouterAndRoutes function with the path to your Express API file.

```js

const { getRouterAndRoutes } = require('routes-explorer');

const apiFilePath = 'path/to/your/api/file.js';

try {
  const { routerVariableName, routes } = getRouterAndRoutes(apiFilePath);
  console.log('Router Variable Name:', routerVariableName);
  console.log('Routes:', routes);
} catch (error) {
  console.error('Error:', error.message);
}
```

# License
MIT


