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
  fields?: Record<string, string | string[]> | string;
  append?: string;
  q?: string;
  [key: string]: any;
}

/**
 * Callback for custom filter logic (scope / custom filters).
 */
export type FilterApplyFn<T extends ObjectLiteral = any> = (
  qb: SelectQueryBuilder<T>,
  value: any,
  alias: string,
) => void;

/**
 * Interface for class-based custom filters, matching Spatie's Filter interface.
 */
export interface FilterInterface<T extends ObjectLiteral = any> {
  apply(
    qb: SelectQueryBuilder<T>,
    value: any,
    alias: string,
    property?: string,
  ): void;
}

/**
 * Callback for custom sort logic.
 */
export type SortApplyFn<T extends ObjectLiteral = any> = (
  qb: SelectQueryBuilder<T>,
  direction: 'ASC' | 'DESC',
  alias: string,
) => void;

/**
 * Interface for class-based custom sorts, matching Spatie's Sort interface.
 */
export interface SortInterface<T extends ObjectLiteral = any> {
  apply(
    qb: SelectQueryBuilder<T>,
    direction: 'ASC' | 'DESC',
    alias: string,
    property?: string,
  ): void;
}

/**
 * Callback for custom include logic.
 */
export type IncludeApplyFn<T extends ObjectLiteral = any> = (
  qb: SelectQueryBuilder<T>,
  alias: string,
) => void;

/**
 * Interface for class-based custom includes, matching Spatie's IncludeInterface.
 */
export interface IncludeInterface<T extends ObjectLiteral = any> {
  apply(qb: SelectQueryBuilder<T>, alias: string, property?: string): void;
}
