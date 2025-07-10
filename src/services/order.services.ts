import database from '../config/database';
import woocommerceAPI from '../config/woocommerce';
import { Collection, Document } from 'mongodb';
import { log } from '../utils/logger.utils';
import { validateOrder } from '../validations/schema';
import productServices from './product.services';
import { Order, OrderQuery } from '../types/order.types';
import { EnvUtils } from '../config/env';

import pLimit from 'p-limit';

class OrderService {
  private collection: Collection<Document> | null = null;

  private async initialize(): Promise<void> {
    if (!this.collection) {
      const db = await database.connect();
      this.collection = db.collection('orders');
    }
  }

  public async syncOrders(): Promise<{ synced: number; errors: number }> {
    await this.initialize();

    const serverConfig = EnvUtils.getServerConfig();
    const fetchDays = serverConfig.orderRetentionDays || 30;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - fetchDays);

    const orderConcurrencyLimit = 5;
    const productConcurrencyLimit = 5;
    const limitOrders = pLimit(orderConcurrencyLimit);
    const limitProducts = pLimit(productConcurrencyLimit);

    let page = 1;
    let hasMore = true;
    let totalSynced = 0;
    let totalErrors = 0;

    while (hasMore) {
      try {
        const orders: Order[] = await woocommerceAPI.fetchOrders({
          page,
          per_page: 100,
          after: thirtyDaysAgo.toISOString(),
          orderby: 'date',
          order: 'desc',
        });

        if (!orders || orders.length === 0) {
          hasMore = false;
          break;
        }

        // Process orders concurrently with limit
        const results = await Promise.all(
          orders.map((order) =>
            limitOrders(async () => {
              try {
                await this.processOrder(order, limitProducts);
                return { success: true };
              } catch (error) {
                log('error', `Error processing order ${order.id}:`, error);
                return { success: false };
              }
            })
          )
        );

        totalSynced += results.filter((r) => r.success).length;
        totalErrors += results.filter((r) => !r.success).length;

        page++;
        hasMore = orders.length === 100;
      } catch (error) {
        log('error', `Error fetching orders page ${page}:`, error);
        totalErrors++;
        break;
      }
    }

    log('info', `Order sync completed. Synced: ${totalSynced}, Errors: ${totalErrors}`);
    return { synced: totalSynced, errors: totalErrors };
  }

  private async processOrder(orderData: Order, limitProducts: pLimit.Limit): Promise<void> {
    const { error, value } = validateOrder(orderData);
    if (error) {
      log('error', 'Order validation failed:', error);
      throw new Error(`Order validation failed: ${error.message}`);
    }

    const order = {
      id: value.id,
      number: value.number,
      order_key: value.order_key,
      status: value.status,
      date_created: new Date(value.date_created),
      total: parseFloat(value.total),
      customer_id: value.customer_id,
      customer_note: value.customer_note,
      billing: value.billing,
      shipping: value.shipping,
      line_items: value.line_items,
      updatedAt: new Date(),
      syncedAt: new Date(),
    };

    await Promise.all(
      order.line_items
        .filter((item) => item.product_id)
        .map((item) =>
          limitProducts(() =>
            productServices.syncProductIfNeeded(Number(item.product_id)).catch((error) => {
              log('error', `Error syncing product ${item.product_id}:`, error);
            })
          )
        )
    );

    await this.collection!.replaceOne({ id: order.id }, order, { upsert: true });

    log('info', `Order ${order.id} processed successfully`);
  }

  public async getOrders(query: OrderQuery = {}) {
    await this.initialize();

    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      sort = 'date_created',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { number: { $regex: search, $options: 'i' } },
        { 'billing.first_name': { $regex: search, $options: 'i' } },
        { 'billing.last_name': { $regex: search, $options: 'i' } },
        { 'billing.email': { $regex: search, $options: 'i' } },
        { 'shipping.first_name': { $regex: search, $options: 'i' } },
        { 'shipping.last_name': { $regex: search, $options: 'i' } },
        { 'line_items.name': { $regex: search, $options: 'i' } },
      ];

      if (!isNaN(Number(search))) {
        filter.$or.push({ id: parseInt(search, 10) });
      }
    }

    if (status) {
      filter.status = status;
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const [orders, total] = await Promise.all([
      this.collection!.find(filter).sort(sortOptions).skip(skip).limit(limit).toArray(),
      this.collection!.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  public async getOrder(id: string | number) {
    await this.initialize();
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const order = await this.collection!.findOne({ id: numericId });

    if (!order) throw new Error('Order not found');

    return order;
  }

  public async getOrdersByProduct(productId: string | number) {
    await this.initialize();
    const numericId = typeof productId === 'string' ? parseInt(productId, 10) : productId;

    return await this.collection!.find({ 'line_items.product_id': numericId })
      .sort({ date_created: -1 })
      .toArray();
  }

  public async cleanupOldOrders(): Promise<{ deleted: number; productsDeleted: number }> {
    try {
      await this.initialize();
      const serverConfig = EnvUtils.getServerConfig();
      const retentionDays = serverConfig.orderRetentionDays;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const ordersToDelete = await this.collection!.find({
        date_created: { $lt: cutoffDate },
      }).toArray();

      if (ordersToDelete.length === 0) {
        log('info', 'No old orders to cleanup');
        return { deleted: 0, productsDeleted: 0 };
      }

      const productIds = new Set<number>();
      ordersToDelete.forEach((order) => {
        order.line_items.forEach((item: any) => {
          if (item.product_id) {
            productIds.add(item.product_id);
          }
        });
      });

      const deleteResult = await this.collection!.deleteMany({
        date_created: { $lt: cutoffDate },
      });

      log('info', `Deleted ${deleteResult.deletedCount} old orders`);

      let productsDeleted = 0;
      for (const productId of productIds) {
        const remainingOrders = await this.collection!.countDocuments({
          'line_items.product_id': productId,
        });

        if (remainingOrders === 0) {
          await productServices.deleteProduct(productId);
          productsDeleted++;
        }
      }

      log(
        'info',
        `Cleanup completed. Orders deleted: ${deleteResult.deletedCount}, Products deleted: ${productsDeleted}`
      );
      return { deleted: deleteResult.deletedCount ?? 0, productsDeleted };
    } catch (error) {
      log('error', 'Error in cleanup process:', error);
      throw error;
    }
  }
}

export default new OrderService();
