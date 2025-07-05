export type Order = {
  id: number;
  number: string;
  order_key: string;
  status: string;
  date_created: string;
  total: string;
  customer_id: number;
  customer_note?: string;
  billing: Record<string, unknown>;
  shipping: Record<string, unknown>;
  line_items: Record<string, unknown>[];
};

export type OrderQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};
