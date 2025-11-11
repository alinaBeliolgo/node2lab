import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Todo API",
      version: "1.0.0",
      description: "API for Todo app",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],
  },
  // Scan router files for JSDoc swagger comments
  apis: [
    "./router/**/*.js",
    "./router/swaggerD.js",
  ],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
