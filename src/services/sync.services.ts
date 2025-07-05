import cron from 'node-cron';
import { SyncResult, SyncStats } from '../types/sync.types';
import { log } from '../utils/logger.utils';
import orderServices from './order.services';

class SyncService {
  private isRunning: boolean;
  private lastSync: Date | null;
  private syncStats: SyncStats;

  constructor() {
    this.isRunning = false;
    this.lastSync = null;
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastError: null,
    };
  }

  public startScheduledSync(): void {
    const cronSchedule = process.env.SYNC_CRON_SCHEDULE || '0 12 * * *';

    cron.schedule(cronSchedule, async () => {
      if (this.isRunning) {
        log('info', 'Sync already running, skipping scheduled sync');
        return;
      }

      log('info', 'Starting scheduled sync');
      await this.runSync();
    });

    log('info', `Scheduled sync initialized with cron: ${cronSchedule}`);
  }

  public async runSync(): Promise<SyncResult> {
    if (this.isRunning) throw new Error('Sync already in progress');

    this.isRunning = true;
    this.syncStats.totalSyncs++;

    try {
      log('info', 'Starting sync process');

      const result = await orderServices.syncOrders();
      const cleanupResult = await orderServices.cleanupOldOrders();

      this.lastSync = new Date();
      this.syncStats.successfulSyncs++;
      this.syncStats.lastError = null;

      log('info', 'Sync completed successfully', {
        ordersSynced: result.synced,
        errors: result.errors,
        ordersDeleted: cleanupResult.deleted,
        productsDeleted: cleanupResult.productsDeleted,
      });

      return {
        success: true,
        ordersSynced: result.synced,
        errors: result.errors,
        ordersDeleted: cleanupResult.deleted,
        productsDeleted: cleanupResult.productsDeleted,
        timestamp: this.lastSync,
      };
    } catch (error: any) {
      this.syncStats.failedSyncs++;
      this.syncStats.lastError = error.message;
      log('error', 'Sync failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  public getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      stats: this.syncStats,
    };
  }
}

export default new SyncService();
