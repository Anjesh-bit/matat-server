import express from 'express';
import ordersRouter from './order.routes';
import productsRouter from './products.routes';
import syncRouter from './sync.routes';

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
