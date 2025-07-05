import { Request, Response, NextFunction } from 'express';
import productServices from '../services/product.services';

export const getProductsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query;
    const result = await productServices.getProducts(query);

    const productsWithOrderCount = await Promise.all(
      result.products.map(async (product) => {
        const orderCount = await productServices.getProductOrderCount(product.id);
        return { ...product, orderCount };
      })
    );

    res.json({
      success: true,
      data: productsWithOrderCount,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;
    const product = await productServices.getProduct(id);
    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    next(error);
  }
};

export const deleteProductHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;
    const deleted = await productServices.deleteProduct(id);

    if (!deleted) {
      res
        .status(404)
        .json({ success: false, message: 'Product not found or could not be deleted' });
      return;
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
