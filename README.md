# **🚀 TrailXpress**  
Parse your Express API and extract various route details like HTTP methods, paths, middleware names, and function bodies.  

## **Features**  
✅ Automatically extracts route details from your Express application.  
✅ Retrieves HTTP methods, paths, middleware names, and function bodies.  
✅ Handles different function types used in route definitions.  
✅ Supports filtering routes based on request type.  
✅ Generates Swagger documentation for API routes.  

## **Installation**  

```bash
npm install trailxpress
```

## **Usage**  
To use this package, include it in your Node.js project and call the `getRoutes` function with the path to your Express API file.

```js
const { getRoutes } = require('trailxpress');

const apiFilePath = 'path/to/your/api/file.js';

try {
  const routes = getRoutes(apiFilePath);
  console.log('Extracted Routes:', routes);
} catch (error) {
  console.error('Error:', error.message);
}
```

### **Filtering Routes by HTTP Method**  
You can filter routes based on request types (GET, POST, PUT, DELETE, etc.).  

```js
const { getRoutes } = require('trailxpress');

const apiFilePath = 'path/to/your/api/file.js';
const filteredRoutes = getRoutes(apiFilePath, ['GET', 'POST']); // Only fetch GET and POST routes
console.log(filteredRoutes);
```

### **Swagger Documentation Generation**  
TrailXpress can generate Swagger documentation for your API.  

```js
const { generateSwagger } = require('trailxpress');

const apiFilePath = 'path/to/your/api/file.js';
const routes = getRoutes(apiFilePath);
const swaggerDocs = generateSwagger(routes);

console.log(swaggerDocs);
```

## **Function Parameters**  

### **getRoutes Function**  

| Parameter      | Type      | Default  | Description |
|--------------|----------|---------|------------|
| `filePath`   | `string` | Required | Path to the Express API file. |
| `methods`    | `array`  | `[]`     | (Optional) Array of HTTP methods to filter (e.g., `['GET', 'POST']`). |

### **generateSwagger Function**  

| Parameter  | Type     | Default  | Description |
|------------|---------|---------|------------|
| `routes`  | `array`  | Required | Array of extracted route details. |
| `title`   | `string` | `"API Documentation"` | (Optional) Title for the Swagger docs. |
| `version` | `string` | `"1.0.0"` | (Optional) API version for Swagger docs. |

## **Issues**  
If you encounter any issues or want to request a new feature, kindly open an issue.  

## **License**  
MIT  
```