const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API Documentation",
      version: "1.0.0",
      description: "API documentation for my Node.js and Express project",
    },
    servers: [
      {
        url: "http://localhost:4000", // Update this with your API base URL
        description: "Local server",
      },
    ],
  },
  apis: ["../routes/index.js"], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
module.exports = swaggerSpec;
