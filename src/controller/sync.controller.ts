import { NextFunction, Request, Response } from 'express';
import syncServices from '../services/sync.services';

export const triggerSyncHandler = async (
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
