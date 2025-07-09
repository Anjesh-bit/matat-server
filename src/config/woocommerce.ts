import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger.utils.js';
import { Order } from '../types/order.types.js';
import { Product } from '../types/product.types.js';
import { EnvUtils } from './env.js';

class WooCommerceAPI {
  private baseURL: string;
  private consumerKey: string;
  private consumerSecret: string;
  private client: AxiosInstance;

  constructor() {
    const wooConfig = EnvUtils.getWooCommerceConfig();
    this.baseURL = wooConfig.baseUrl;
    this.consumerKey = wooConfig.consumerKey;
    this.consumerSecret = wooConfig.consumerSecret;

    this.client = axios.create({
      baseURL: `${this.baseURL}/wp-json/wc/v3`,
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret,
      },
      timeout: 30000,
      headers: {
        'User-Agent': 'WooCommerce-Sync-App/1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`WooCommerce API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: AxiosError) => {
        logger.error('WooCommerce API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`WooCommerce API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        logger.error('WooCommerce API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async fetchOrders(params: Record<string, any> = {}): Promise<Order[]> {
    try {
      const response = await this.client.get('/orders', { params });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching orders:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async fetchProducts(params: Record<string, any> = {}): Promise<Order[]> {
    try {
      const response = await this.client.get('/products', { params });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  async fetchProduct(productId: number | string): Promise<Product> {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching product ${productId}:`, error);
      throw new Error(`Failed to fetch product ${productId}: ${error.message}`);
    }
  }
}

export default new WooCommerceAPI();
