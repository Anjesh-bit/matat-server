import express from 'express';
import { validateQuery } from '../../middleware/validate-query.middleware.js';
import {
  deleteProductHandler,
  getProductByIdHandler,
  getProductsHandler,
} from '../../controller/products.controller.js';
const router = express.Router();

router.get('/', validateQuery, getProductsHandler);
router.get('/:id', getProductByIdHandler);
router.delete('/:id', deleteProductHandler);

export default router;
