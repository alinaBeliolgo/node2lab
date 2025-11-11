import express from 'express'
import * as todoController from '../controller/todoController.js'

const router = express.Router()

router.get('/', todoController.listTodos)
router.post('/', todoController.createTodo)

router.get('/:id', todoController.getTodo)
router.put('/:id', todoController.updateTodo)
router.delete('/:id', todoController.deleteTodo)
router.patch('/:id/toggle', todoController.toggleTodo)
export default router