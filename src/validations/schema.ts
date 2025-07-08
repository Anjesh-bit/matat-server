import Joi, { ValidationResult } from 'joi';
import { Order } from '../types/order.types';
import { Product } from '../types/product.types';
import { QueryParams } from '../types/query-params.types';

type JoiValidateResult<T> = ValidationResult<T>;

export const orderSchema = Joi.object({
  id: Joi.number().required(),
  number: Joi.string().required(),
  order_key: Joi.string().required(),
  status: Joi.string().required(),
  date_created: Joi.string().required(),
  total: Joi.string().required(),
  customer_id: Joi.number().required(),
  customer_note: Joi.string().allow(''),
  billing: Joi.object().required(),
  shipping: Joi.object().required(),
  line_items: Joi.array().items(Joi.object()).required(),
}).unknown(true);

export const productSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  sku: Joi.string().allow(''),
  price: Joi.string().required(),
  regular_price: Joi.string().allow(''),
  sale_price: Joi.string().allow(''),
  description: Joi.string().allow(''),
  short_description: Joi.string().allow(''),
  images: Joi.array().items(Joi.object()).default([]),
  stock_quantity: Joi.number().allow(null),
  in_stock: Joi.boolean().default(true),
}).unknown(true);

export const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow(''),
  status: Joi.string().allow(''),
  sort: Joi.string().valid('date_created', 'total', 'name', 'price').default('date_created'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  product_id: Joi.number().optional(),
});

export function validateOrder(data: unknown): JoiValidateResult<Order> {
  return orderSchema.validate(data);
}

export function validateProduct(data: unknown): JoiValidateResult<Product> {
  return productSchema.validate(data);
}

export function validateQuery(data: unknown): JoiValidateResult<QueryParams> {
  return querySchema.validate(data);
}
