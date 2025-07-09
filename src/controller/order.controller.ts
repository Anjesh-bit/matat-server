import { Request, Response, NextFunction } from 'express';
import orderServices from '../services/order.services.js';

export const getOrdersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await orderServices.getOrders(req.query);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersByProductHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.productId;

    const orders = await orderServices.getOrdersByProduct(parseInt(productId, 10));

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await orderServices.getOrder(id);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message === 'Order not found') {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }
    next(error);
  }
};
