import express from 'express';
import { getStatusHandler, triggerSyncHandler } from '../../controller/sync.controller.js';

const router = express.Router();

router.get('/status', getStatusHandler);

router.post('/trigger', triggerSyncHandler);

export default router;
