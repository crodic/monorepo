import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Query parameters parsed from the request URL.
 * Supports bracket notation: ?filter[name]=john&sort=-createdAt&include=roles&page=1&limit=15
 */
export interface QueryParams {
  filter?: Record<string, any>;
  sort?: string;
  include?: string;
  page?: number | string;
  limit?: number | string;
  q?: string;
  [key: string]: any;
}

/**
 * Callback for custom filter logic (scope filters).
 */
export type FilterApplyFn<T extends ObjectLiteral = any> = (
  qb: SelectQueryBuilder<T>,
  value: any,
  alias: string,
) => void;

/**
 * Callback for custom sort logic.
 */
export type SortApplyFn<T extends ObjectLiteral = any> = (
  qb: SelectQueryBuilder<T>,
  direction: 'ASC' | 'DESC',
  alias: string,
) => void;

/**
 * Callback for custom include logic.
 */
export type IncludeApplyFn<T extends ObjectLiteral = any> = (
  qb: SelectQueryBuilder<T>,
  alias: string,
) => void;
