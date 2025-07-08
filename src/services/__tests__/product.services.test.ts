import ProductService from '../product.services';
import database from '../../config/database';

jest.mock('../../config/database');
jest.mock('../../config/woocommerce');
jest.mock('../../utils/logger.utils');

const mockCollection = {
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn(),
  replaceOne: jest.fn(),
  countDocuments: jest.fn(),
  deleteOne: jest.fn(),
  project: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
};

const mockOrdersCollection = {
  distinct: jest.fn().mockResolvedValue([]),
  deleteMany: jest.fn(),
  countDocuments: jest.fn(),
};

const mockDb = {
  collection: jest.fn((name: string) => {
    if (name === 'products') return mockCollection;
    if (name === 'orders') return mockOrdersCollection;
    return {};
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  (database.connect as jest.Mock).mockResolvedValue(mockDb);
});

describe('ProductService', () => {
  describe('syncProductIfNeeded', () => {
    it('should skip syncing if product exists', async () => {
      const existingProduct = { id: 5, name: 'Product 5' };
      mockCollection.findOne.mockResolvedValue(existingProduct);

      const product = await ProductService.syncProductIfNeeded(5);

      expect(product).toEqual(existingProduct);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: 5 });
    });

    it('should sync product if not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const productMock = { id: 6, name: 'Product 6' };
      ProductService.syncProduct = jest.fn().mockResolvedValue(productMock);

      const product = await ProductService.syncProductIfNeeded(6);

      expect(product).toEqual(productMock);
      expect(ProductService.syncProduct).toHaveBeenCalledWith(6);
    });
  });

  describe('getProduct', () => {
    it('should return product by id', async () => {
      const product = { id: 10, name: 'Prod 10' };
      mockCollection.findOne.mockResolvedValue(product);

      const result = await ProductService.getProduct(10);

      expect(result).toEqual(product);
    });

    it('should throw if product not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await expect(ProductService.getProduct(999)).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product and return true on success', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await ProductService.deleteProduct(15);

      expect(result).toBe(true);
    });

    it('should return false if no product deleted', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await ProductService.deleteProduct(16);

      expect(result).toBe(false);
    });
  });

  describe('getProductOrderCount', () => {
    it('should return count of orders containing the product', async () => {
      mockOrdersCollection.countDocuments.mockResolvedValue(5);

      const count = await ProductService.getProductOrderCount(20);

      expect(count).toBe(5);
      expect(mockOrdersCollection.countDocuments).toHaveBeenCalledWith({
        'line_items.product_id': 20,
      });
    });
  });
});
