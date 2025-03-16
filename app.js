const express = require('express');
const {generateSwagger, generatePostmanCollection, getRoutes} = require('./index.js');

const app = express.Router();

// Example routes
app.get('/users', (req, res) => res.json([]));
app.get('/users/:id', (req, res) => res.json({}));
app.post('/users', (req, res) => res.json({}));

const routes=getRoutes('./app.js');
console.log(routes);
