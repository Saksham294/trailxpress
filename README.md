---

# **🚀 TrailXpress**  
Parse your Express API and extract various route details like HTTP methods, paths, middleware names, and function bodies.  

## **Features**  
✅ **Extract Routes**: Automatically extracts route details from your Express application.  
✅ **Middleware Detection**: Retrieves middleware names along with route details.  
✅ **Supports Different Function Types**: Works with inline, arrow, and named functions.  
✅ **Swagger Documentation**: Generates Swagger docs automatically.  
✅ **Postman Collection Generation**: Exports API routes as a Postman collection.  
✅ **CLI Support**: Use TrailXpress directly from the command line.  

---

## **Installation**  
Install TrailXpress via npm:  
```bash
npm install trailxpress
```

To use it globally for CLI:  
```bash
npm install -g trailxpress
```

---

## **Usage**  

### **1️⃣ Programmatic Usage**  
Include TrailXpress in your Node.js project and extract routes from an Express API file.  

```js
//app.js
const express = require('express');
const userRoutes = require('./routes/user.routes.js');
const productRoutes = require('./routes/product.routes.js');
const { isAuthenticated } = require('./middlewares/auth.middleware');

const app = express();
const router=express.Router();

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

//index.js
const { getRoutes } = require('./src/generators/routesGenerator.js');
console.log(getRoutes(__filename, ['post']));
```

#### **Sample Output**  
```js
[
  {
    method: 'GET',
    path: '/',
    middlewares: [],
    handlerName: '',
    handlerCode: "(req, res) => {\n  res.send('Welcome to the API');\n}"
  },
  {
    method: 'POST',
    path: '/api/users/',
    middlewares: [ 'isAuthenticated' ],
    handlerName: 'createUser',
    handlerCode: '(req, res) => {\n' +
      '  const {\n' +
      '    name,\n' +
      '    email\n' +
      '  } = req.body;\n' +
      '  res.status(201).json({\n' +
      '    id: Date.now(),\n' +
      '    name,\n' +
      '    email\n' +
      '  });\n' +
      '}'
  },
  {
    method: 'GET',
    path: '/api/products/:id',
    middlewares: [],
    handlerName: 'getProductById',
    handlerCode: '(req, res) => {\n' +
      '  const {\n' +
      '    id\n' +
      '  } = req.params;\n' +
      '  res.json({\n' +
      '    id,\n' +
      "    name: 'Sample Product'\n" +
      '  });\n' +
      '}'
  }
]
```

---

### **2️⃣ CLI Usage**  
You can use TrailXpress from the command line without writing any code.

#### **Extract routes from an API file**
```bash
trailxpress extract -f api.js
```

#### **Generate Swagger documentation**
```bash
trailxpress swagger -f api.js -s
```
`-s` saves the output to a file (`swagger.json`).

#### **Generate Postman Collection**
```bash
trailxpress postman -f api.js -c config.json -s
```
`-c config.json` allows passing custom configuration (see below).

---

## **Config File (`config.json`)**
Instead of passing multiple CLI flags, you can specify settings in a config file.

```json
{
  "name": "My API",
  "description": "Automatically generated API documentation",
  "baseUrl": "https://api.example.com",
  "version": "2.1.0",
  "save": true
}
```

---

## **Programmatic API - Function Parameters**  

### **getRoutes Function**  
| Parameter  | Type      | Default  | Description |
|------------|----------|----------|------------|
| `filePath` | `string` | Required | Path to the Express API file. |
| `methods`  | `array`  | `[]`      | (Optional) Array of HTTP methods to filter. |

### **generateSwagger Function**  
| Parameter | Type      | Default  | Description |
|-----------|----------|----------|------------|
| `routes`  | `array`  | Required | Array of extracted route details. |
| `save`    | `boolean` | `false`  | (Optional) Save Swagger doc. |
| `format`  | `string`  | `"JSON"` | (Optional) "YAML" for YAML format. |

#### **Example Usage**  

```js
const { generateSwagger, getRoutes } = require('trailxpress');

const apiFilePath = 'path/to/your/api/file.js';
const routes = getRoutes(apiFilePath);
const swaggerDocs = generateSwagger(routes,true,'yaml');

console.log(swaggerDocs);
```


### **generatePostmanCollection Function**  
| Parameter  | Type      | Default  | Description |
|------------|----------|----------|------------|
| `routes`  | `array`   | Required | Extracted route details. |
| `options` | `object`  | `{}`      | (Optional) Custom Postman collection options. |

#### **Example Usage**  
```js
const { generatePostmanCollection, getRoutes } = require('trailxpress');

const routes = getRoutes('path/to/api.js');

const options = {
  name: 'My API Collection',
  description: 'Postman collection for my API',
  baseUrl: 'https://api.example.com'
};

const postmanCollection = generatePostmanCollection(routes, options);
console.log(JSON.stringify(postmanCollection, null, 2));
```

---

## **Issues & Feature Requests**  
If you encounter any issues or have feature requests, open an issue on GitHub.  

---

## **License**  
MIT  

---