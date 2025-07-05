export type Product = {
  id: number;
  name: string;
  sku?: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  description?: string;
  short_description?: string;
  images: Record<string, unknown>[];
  stock_quantity?: number | null;
  in_stock: boolean;
};

export type ProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};
