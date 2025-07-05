import { Collection, Document } from 'mongodb';
import database from '../config/database';
import woocommerceAPI from '../config/woocommerce';
import { log } from '../utils/logger.utils';
import { validateProduct } from '../validations/schema';
import { Product, ProductQuery } from '../types/product.types';

class ProductService {
  private collection: Collection<Document> | null = null;

  private async initialize(): Promise<void> {
    if (!this.collection) {
      const db = await database.connect();
      this.collection = db.collection('products');
    }
  }

  public async syncProductIfNeeded(productId: number): Promise<Document | null> {
    await this.initialize();

    const existingProduct = await this.collection!.findOne({ id: productId });
    if (existingProduct) {
      log('debug', `Product ${productId} already exists, skipping sync`);
      return existingProduct;
    }

    return await this.syncProduct(productId);
  }

  public async syncProduct(productId: number): Promise<Document | null> {
    try {
      const products = await woocommerceAPI.fetchProduct(productId);
      return await this.processProduct(products);
    } catch (error) {
      log('error', `Error syncing product ${productId}:`, error);
      throw error;
    }
  }

  private async processProduct(products: Product): Promise<Document> {
    const { error, value } = validateProduct(products);
    if (error) {
      log('error', 'Product validation failed:', error);
      throw new Error(`Product validation failed: ${error.message}`);
    }

    const product = {
      id: value.id,
      name: value.name,
      sku: value.sku,
      price: parseFloat(value.price || '0'),
      regular_price: parseFloat(value.regular_price || '0'),
      sale_price: parseFloat(value.sale_price || '0'),
      description: value.description,
      short_description: value.short_description,
      images: value.images,
      stock_quantity: value.stock_quantity,
      in_stock: value.in_stock,
      updatedAt: new Date(),
      syncedAt: new Date(),
    };

    await this.collection!.replaceOne({ id: product.id }, product, { upsert: true });

    log('debug', `Product ${product.id} processed successfully`);
    return product;
  }

  public async getProducts(query: ProductQuery = {}) {
    await this.initialize();

    const { page = 1, limit = 20, search = '', sort = 'name', order = 'asc' } = query;

    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      this.collection!.find(filter).sort(sortOptions).skip(skip).limit(limit).toArray(),
      this.collection!.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  public async getProduct(id: string | number): Promise<Document> {
    await this.initialize();
    const product = await this.collection!.findOne({ id: parseInt(id as string, 10) });
    if (!product) throw new Error('Product not found');

    return product;
  }

  public async deleteProduct(productId: string | number): Promise<boolean> {
    await this.initialize();
    const result = await this.collection!.deleteOne({ id: parseInt(productId as string, 10) });
    log('debug', `Product ${productId} deleted: ${result.deletedCount! > 0}`);
    return result.deletedCount! > 0;
  }

  public async getProductOrderCount(productId: string | number): Promise<number> {
    const db = await database.connect();
    const ordersCollection = db.collection('orders');
    return await ordersCollection.countDocuments({
      'line_items.product_id': parseInt(productId as string, 10),
    });
  }
}

export default new ProductService();
