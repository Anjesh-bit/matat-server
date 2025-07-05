export type QueryParams = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sort: 'date_created' | 'total' | 'name' | 'price';
  order: 'asc' | 'desc';
};
