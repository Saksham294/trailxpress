const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

async function generatePostmanCollection(routes, options = {}) {
    const defaultOptions = {
        name: 'API Documentation',
        description: '',
        baseUrl: 'http://localhost:3000',
        version: '2.1.0',
        save: false
    };

    const config = { ...defaultOptions, ...options };

    const collection = {
        info: {
            name: config.name,
            description: config.description,
            schema: `https://schema.getpostman.com/json/collection/v${config.version}/collection.json`,
            _postman_id: crypto.randomUUID()
        },
        item: generateItems(routes),
        variable: [
            {
                key: "baseUrl",
                value: config.baseUrl,
                type: "string"
            }
        ]
    };

    if (config.save) {
        try {
            const fileName = `${config.name.toLowerCase().replace(/\s+/g, '-')}-postman-collection.json`;
            const outputPath = path.resolve(process.cwd(), fileName);
            await fs.writeFile(outputPath, JSON.stringify(collection, null, 2));
        } catch (error) {
            throw new Error(`Failed to save Postman collection: ${error.message}`);
        }
    }

    return collection;
}

function generateItems(routes) {
    return routes.map(route => ({
        name: `${route.method.toUpperCase()} ${route.path}`,
        request: {
            method: route.method.toUpperCase(),
            header: generateHeaders(route),
            url: generateUrl(route),
            description: generateDescription(route)
        },
        response: []
    }));
}

function generateHeaders(route) {
    const headers = [
        {
            key: "Content-Type",
            value: "application/json",
            type: "text"
        }
    ];
    if (hasAuthMiddleware(route)) {
        headers.push({
            key: "Authorization",
            value: "Bearer {{authToken}}",
            type: "text"
        });
    }

    return headers;
}

function generateUrl(route) {
    const pathSegments = route.path.split('/').filter(Boolean);
    const variables = extractUrlVariables(route.path);

    return {
        raw: `{{baseUrl}}${route.path}`,
        host: ["{{baseUrl}}"],
        path: pathSegments,
        variable: variables
    };
}

function extractUrlVariables(path) {
    const variables = [];
    const paramRegex = /:([^/]+)/g;
    let match;

    while ((match = paramRegex.exec(path)) !== null) {
        variables.push({
            key: match[1],
            value: "",
            description: `Parameter: ${match[1]}`
        });
    }

    return variables;
}

function generateDescription(route) {
    let description = route.description || '';

    if (route.middleware && route.middleware.length > 0) {
        description += '\n\nMiddleware:\n';
        route.middleware.forEach(mw => {
            description += `- ${mw.name || 'anonymous'}\n`;
        });
    }

    return description;
}

function hasAuthMiddleware(route) {
    return route.middleware && route.middleware.some(mw => 
        /auth|jwt|passport|session/i.test(mw.name || mw.toString())
    );
}

module.exports = { generatePostmanCollection }; 