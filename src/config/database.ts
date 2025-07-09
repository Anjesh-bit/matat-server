import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { log } from '../utils/logger.utils.js';
import { EnvUtils } from './env.js';

class Database {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<Db> {
    try {
      if (this.isConnected && this.db) return this.db;

      const serverConfig = EnvUtils.getServerConfig();
      const { dbName, dbPassword, dbUserName } = serverConfig;

      const requiredVars = [dbUserName, dbPassword, dbName];

      if (requiredVars.some((v) => !v)) throw new Error('Missing MongoDB environment variables');

      const uri = `mongodb+srv://${dbUserName}:${dbPassword}@${dbName}.cv9ka.mongodb.net/?retryWrites=true&w=majority`;

      const options: MongoClientOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.client = new MongoClient(uri, options);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;

      await this.createIndexes();

      log('info', 'Connected to MongoDB successfully');
      return this.db;
    } catch (error) {
      log('error', 'Database connection error:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      const ordersCollection = this.db.collection('orders');
      const productsCollection = this.db.collection('products');

      await ordersCollection.createIndex({ id: 1 }, { unique: true });
      await ordersCollection.createIndex({ number: 1 });
      await ordersCollection.createIndex({ status: 1 });
      await ordersCollection.createIndex({ date_created: -1 });
      await ordersCollection.createIndex({ customer_id: 1 });
      await ordersCollection.createIndex({ 'billing.email': 1 });
      await ordersCollection.createIndex({ 'shipping.first_name': 1 });
      await ordersCollection.createIndex({ 'shipping.last_name': 1 });
      await ordersCollection.createIndex({ updatedAt: 1 });

      await productsCollection.createIndex({ id: 1 }, { unique: true });
      await productsCollection.createIndex({ name: 1 });
      await productsCollection.createIndex({ sku: 1 });
      await productsCollection.createIndex({ price: 1 });
      await productsCollection.createIndex({ updatedAt: 1 });

      log('info', 'Database indexes created successfully');
    } catch (error) {
      log('error', 'Error creating indexes:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        log('info', 'Disconnected from MongoDB');
      }
    } catch (error) {
      log('error', 'Error disconnecting from MongoDB:', error);
    }
  }

  getDb(): Db {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }
}

export default new Database();
