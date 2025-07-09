import { NextFunction, Request, Response } from 'express';
import syncServices from '../services/sync.services.js';
import productServices from '../services/product.services.js';

export const syncOrdersHandler = async (
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await syncServices.runSync();
    res.json({
      success: true,
      message: 'Sync completed successfully',
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'Sync already in progress') {
      res.status(409).json({
        success: false,
        message: 'Sync already in progress',
      });
      return;
    }
    next(error);
  }
};

export const getStatusHandler = (req: Request, res: Response): void => {
  const status = syncServices.getSyncStatus();
  res.json({
    success: true,
    data: status,
  });
};

export const syncProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const syncedProducts = await productServices.syncAllMissingProducts();

    res.json({
      success: true,
      message: `Synced ${syncedProducts.length} missing products from WooCommerce`,
      data: syncedProducts,
    });
  } catch (error) {
    next(error);
  }
};
