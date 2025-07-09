import { syncProductsHandler } from '../../controller/sync.controller.js';
import express from 'express';
import { getStatusHandler, syncOrdersHandler } from '../../controller/sync.controller.js';

const router = express.Router();

router.get('/status', getStatusHandler);

router.post('/orders', syncOrdersHandler);
router.post('/products', syncProductsHandler);

export default router;
