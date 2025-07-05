export type SyncStats = {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastError: string | null;
};

export type SyncResult = {
  success: boolean;
  ordersSynced: number;
  errors: number;
  ordersDeleted: number;
  productsDeleted: number;
  timestamp: Date;
};
