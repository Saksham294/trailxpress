# Routes Explorer

Parse your Express API and find various route details like HTTP method, paths and function bodies"



# Features

- Automatically extract route details from your Express application.
- Retrieves HTTP methods, paths, and function bodies from your Express API.
- Handles different function types used in route definitions.

## Installation

```bash
npm install routes-explorer
```

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

# Issues
If you encounter any issues or want a feature request kindly open an issue.

# License
MIT


