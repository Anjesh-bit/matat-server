import express from 'express';
import ordersRouter from './order.routes.js';
import productsRouter from './products.routes.js';
import syncRouter from './products.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WooCommerce Sync API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

router.use('/orders', ordersRouter);
router.use('/products', productsRouter);
router.use('/sync', syncRouter);

export default router;
