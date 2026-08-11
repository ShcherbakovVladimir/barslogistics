/** Shared pagination helpers for REST endpoints. */

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginationQuery = {
  page: number;
  pageSize: number;
  all: boolean;
  search: string;
};

export function parsePaginationQuery(query: Record<string, unknown>): PaginationQuery {
  const all = query.all === "1" || query.all === "true";
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const rawSize = Number.parseInt(String(query.limit ?? query.pageSize ?? "50"), 10) || 50;
  const pageSize = Math.min(500, Math.max(1, rawSize));
  const search = String(query.search ?? query.q ?? "").trim();
  return { page, pageSize, all, search };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}
