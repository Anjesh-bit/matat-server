import express from 'express';

import {
  getOrderByIdHandler,
  getOrdersByProductHandler,
  getOrdersHandler,
} from '../../controller/order.controller.js';
import { validateQuery } from '../../middleware/validate-query.middleware.js';

const router = express.Router();

router.get('/', validateQuery, getOrdersHandler);
router.get('/:id', getOrderByIdHandler);
router.get('/product/:productId', getOrdersByProductHandler);

export default router;
