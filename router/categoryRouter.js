import express from 'express'
import * as categoryController from '../controller/categoryController.js'

const router = express.Router()

router.get('/', categoryController.listCategories)
router.post('/', categoryController.createCategory)

router.get('/:id', categoryController.getCategory)
router.put('/:id', categoryController.updateCategory)
router.delete('/:id', categoryController.deleteCategory)

export default router