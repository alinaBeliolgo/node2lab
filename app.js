import express from "express";
import "dotenv/config.js";

// import routers
import todoRouter from "./router/todoRouter.js";
import categoryRouter from "./router/categoryRouter.js";
import { createTables } from "./utils/create.js";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger/swagger.js';


const PORT = 3000;

const app = express();

app.use(express.json());

createTables();


app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Todo API',
    docs: '/api-docs',
    endpoints: {
      categories: '/api/categories',
      todos: '/api/todos'
    }
  });
});

app.use("/api/todos", todoRouter);
app.use("/api/categories", categoryRouter);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.listen(PORT, () => {
  console.log(`server started at http://localhost:${PORT}`);
});
