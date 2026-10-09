export interface PaginatedResult<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}
