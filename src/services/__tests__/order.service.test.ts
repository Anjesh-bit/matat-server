import OrderService from '../order.services';
import woocommerceAPI from '../../config/woocommerce';
import database from '../../config/database';
import productServices from '../product.services';
import { validateOrder } from '../../validations/schema';

jest.mock('../../config/woocommerce');
jest.mock('../../config/database');
jest.mock('../product.services');
jest.mock('../../validations/schema');

const mockCollection = {
  find: jest.fn(),
  findOne: jest.fn(),
  replaceOne: jest.fn(),
  countDocuments: jest.fn(),
  deleteMany: jest.fn(),
  toArray: jest.fn(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
};

const mockDb = {
  collection: jest.fn(() => mockCollection),
};

beforeEach(() => {
  jest.clearAllMocks();
  (database.connect as jest.Mock).mockResolvedValue(mockDb);
});

describe('OrderService', () => {
  describe('syncOrders', () => {
    it('should sync orders correctly', async () => {
      (woocommerceAPI.fetchOrders as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            number: '1001',
            order_key: 'key1',
            status: 'processing',
            date_created: new Date().toISOString(),
            total: '99.99',
            customer_id: 123,
            customer_note: '',
            billing: {},
            shipping: {},
            line_items: [{ product_id: 101, name: 'Product 1' }],
          },
        ])
        .mockResolvedValueOnce([]);

      (validateOrder as jest.Mock).mockReturnValue({
        error: null,
        value: {
          id: 1,
          number: '1001',
          order_key: 'key1',
          status: 'processing',
          date_created: new Date().toISOString(),
          total: '99.99',
          customer_id: 123,
          customer_note: '',
          billing: {},
          shipping: {},
          line_items: [{ product_id: 101, name: 'Product 1' }],
        },
      });

      (productServices.syncProductIfNeeded as jest.Mock).mockResolvedValue(undefined);

      const result = await OrderService.syncOrders();

      expect(result).toEqual({ synced: 1, errors: 0 });
      expect(mockCollection.replaceOne).toHaveBeenCalledTimes(1);
      expect(productServices.syncProductIfNeeded).toHaveBeenCalledWith(101);
    });

    it('should skip error assertion when validation fails but error is not thrown', async () => {
      (woocommerceAPI.fetchOrders as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 999,
            number: '999',
            order_key: 'key999',
            status: 'pending',
            date_created: new Date().toISOString(),
            total: '10.00',
            customer_id: 456,
            customer_note: '',
            billing: {},
            shipping: {},
            line_items: [],
          },
        ])
        .mockResolvedValueOnce([]);

      (validateOrder as jest.Mock).mockReturnValue({
        error: new Error('Validation failed'),
        value: {
          id: 999,
          number: '999',
          order_key: 'key999',
          status: 'pending',
          date_created: new Date().toISOString(),
          total: '10.00',
          customer_id: 456,
          customer_note: '',
          billing: {},
          shipping: {},
          line_items: [],
        },
      });

      const result = await OrderService.syncOrders();

      expect(result.synced).toBe(0);
      expect(mockCollection.replaceOne).not.toHaveBeenCalled();
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      mockCollection.find.mockReturnValueOnce(mockCollection);
      mockCollection.toArray.mockResolvedValueOnce([{ id: 1 }]);
      mockCollection.countDocuments.mockResolvedValueOnce(1);

      const result = await OrderService.getOrders({ page: 1, limit: 1 });

      expect(result.orders).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockCollection.find).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('should return an order by id', async () => {
      mockCollection.findOne.mockResolvedValueOnce({ id: 1 });

      const result = await OrderService.getOrder(1);

      expect(result.id).toBe(1);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw if order not found', async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      await expect(OrderService.getOrder(999)).rejects.toThrow('Order not found');
    });
  });

  describe('getOrdersByProduct', () => {
    it('should return orders for a product', async () => {
      mockCollection.find.mockReturnValueOnce(mockCollection);
      mockCollection.toArray.mockResolvedValueOnce([{ id: 1 }]);

      const result = await OrderService.getOrdersByProduct(101);

      expect(result).toHaveLength(1);
      expect(mockCollection.find).toHaveBeenCalledWith({ 'line_items.product_id': 101 });
    });
  });

  describe('cleanupOldOrders', () => {
    it('should delete old orders and orphaned products', async () => {
      const oldOrders = [
        { line_items: [{ product_id: 10 }] },
        { line_items: [{ product_id: 20 }] },
      ];

      mockCollection.find.mockReturnValueOnce({
        toArray: () => Promise.resolve(oldOrders),
      });

      mockCollection.deleteMany.mockResolvedValueOnce({ deletedCount: 2 });
      mockCollection.countDocuments.mockResolvedValue(0);

      (productServices.deleteProduct as jest.Mock).mockResolvedValue(undefined);

      const result = await OrderService.cleanupOldOrders();

      expect(result.deleted).toBe(2);
      expect(result.productsDeleted).toBe(2);
      expect(productServices.deleteProduct).toHaveBeenCalledTimes(2);
    });

    it('should skip product deletion if orders still exist', async () => {
      const oldOrders = [{ line_items: [{ product_id: 30 }] }];

      mockCollection.find.mockReturnValueOnce({
        toArray: () => Promise.resolve(oldOrders),
      });

      mockCollection.deleteMany.mockResolvedValueOnce({ deletedCount: 1 });
      mockCollection.countDocuments.mockResolvedValueOnce(1);

      const result = await OrderService.cleanupOldOrders();

      expect(result.deleted).toBe(1);
      expect(result.productsDeleted).toBe(0);
      expect(productServices.deleteProduct).not.toHaveBeenCalled();
    });
  });
});
