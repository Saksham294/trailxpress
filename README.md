### **Routes Explorer**  
Parse your Express API and extract various route details like HTTP methods, paths, middleware names, and function bodies.  

## **Features**  
✅ Automatically extracts route details from your Express application.  
✅ Retrieves HTTP methods, paths, middleware names, and function bodies.  
✅ Handles different function types used in route definitions.  
✅ Supports filtering routes based on request type.  
✅ Generates Swagger documentation for API routes.  

## **Installation**  

```bash
npm install routes-explorer
```

## **Usage**  
To use this package, include it in your Node.js project and call the `getRouterAndRoutes` function with the path to your Express API file.

```js
const { getRoutes } = require('routes-explorer');

const apiFilePath = 'path/to/your/api/file.js';

try {
  const routes = getRoutes(apiFilePath);
  console.log('Extracted Routes:', routes);
} catch (error) {
  console.error('Error:', error.message);
}

```

### **Filtering Routes by HTTP Method**  
You can filter routes based on request types (GET, POST, PUT, DELETE, etc.)  

```js
const { getRoutes } = require('routes-explorer');

const apiFilePath = 'path/to/your/api/file.js';
const filteredRoutes = getRoutes(apiFilePath, ['GET', 'POST']); // Only fetch GET and POST routes
console.log(filteredRoutes);
```

### **Swagger Documentation Generation**  
Routes Explorer can generate Swagger documentation for your API.  

```js
const { generateSwaggerDocs } = require('routes-explorer');

const apiFilePath = 'path/to/your/api/file.js';
const swaggerDocs = generateSwaggerDocs(apiFilePath);

console.log(swaggerDocs);
```

## **Issues**  
If you encounter any issues or want to request a new feature, kindly open an issue.  

## **License**  
MIT  