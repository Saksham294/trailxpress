# **🚀 TrailXpress**  
Parse your Express API and extract various route details like HTTP methods, paths, middleware names, and function bodies.  

## **Features**  
✅ Automatically extracts route details from your Express application.  
✅ Retrieves HTTP methods, paths, middleware names, and function bodies.  
✅ Handles different function types used in route definitions.  
✅ Supports filtering routes based on request type.  
✅ Generates Swagger documentation for API routes.  
✅ Generates Postman collections for API testing.  

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

/*
Sample Output

[
  {
    method: 'GET',
    path: '/',
    middlewares: [],
    handler: "(req, res) => {\n  res.send('hello world');\n}"
  },
  {
  {
    method: 'POST',
    path: '/login',
    middlewares: ['isAuthenticated'],
    handler: "(req, res) => {\n  res.send('hello world');\n}"
  },
  {
    method: 'DELETE',
    path: '/delete',
    middlewares: [],
    handler: "(req, res) => {\n  res.send('hello world');\n}"
  },
] 
*/
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

### **Postman Collection Generation**
TrailXpress can generate Postman collections for easy API testing.

```js
const { generatePostmanCollection } = require('trailxpress');

const routes = getRoutes(apiFilePath);
await generatePostmanCollection(routes, {
    name: 'My API',
    baseUrl: 'https://api.example.com',
    save: true  // Will save as my-api-postman-collection.json
});
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
| `save`   | `boolean` | `false` | (Optional) Save the Swagger doc. |
| `format` | `string` | `"JSON"` | (Optional) "YAML" for YAML format. |

### **generatePostmanCollection Function**

| Parameter  | Type     | Default  | Description |
|------------|---------|---------|------------|
| `routes`  | `array`  | Required | Array of extracted route details. |
| `options.name` | `string` | `"API Documentation"` | Name of the Postman collection. |
| `options.baseUrl` | `string` | `"http://localhost:3000"` | Base URL for the API. |
| `options.save` | `boolean` | `false` | Save collection to file. |

## **Issues**  
If you encounter any issues or want to request a new feature, kindly open an issue.  

## **License**  
MIT  