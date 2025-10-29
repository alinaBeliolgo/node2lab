import express from "express";
import todoController from "../controllers/todoController.js";

const router = express.Router();

// REST API для задач
router.get("/", todoController.list);
router.get("/:id", todoController.getById);
router.post("/", todoController.create);
router.put("/:id", todoController.update);
router.patch("/:id/toggle", todoController.toggle);
router.delete("/:id", todoController.remove);

export default router;