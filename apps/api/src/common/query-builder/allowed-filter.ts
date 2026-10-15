import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { FilterApplyFn } from './types';

export enum FilterOperator {
  EXACT = 'exact',
  PARTIAL = 'partial',
  SCOPE = 'scope',
}

export class AllowedFilter<T extends ObjectLiteral = any> {
  private constructor(
    /** Name used in the query string: ?filter[name]=... */
    public readonly name: string,
    /** Actual database column name */
    public readonly column: string,
    /** Filter operator type */
    public readonly operator: FilterOperator,
    /** Custom scope function (only for SCOPE type) */
    public readonly scopeFn?: FilterApplyFn<T>,
  ) {}

  /**
   * Create an exact match filter (WHERE col = value).
   * Automatically handles arrays as IN queries.
   *
   * @param name - Filter name in query string
   * @param column - Database column name (defaults to name)
   *
   * @example
   * AllowedFilter.exact('status')             // ?filter[status]=active
   * AllowedFilter.exact('role', 'roleId')     // ?filter[role]=1 → WHERE roleId = 1
   */
  static exact<T extends ObjectLiteral = any>(
    name: string,
    column?: string,
  ): AllowedFilter<T> {
    return new AllowedFilter(name, column ?? name, FilterOperator.EXACT);
  }

  /**
   * Create a partial match filter (WHERE col ILIKE %value%).
   * This is the default when passing a plain string to allowedFilters().
   *
   * @param name - Filter name in query string
   * @param column - Database column name (defaults to name)
   *
   * @example
   * AllowedFilter.partial('name')             // ?filter[name]=john → ILIKE '%john%'
   * AllowedFilter.partial('search', 'title')  // ?filter[search]=hello → title ILIKE '%hello%'
   */
  static partial<T extends ObjectLiteral = any>(
    name: string,
    column?: string,
  ): AllowedFilter<T> {
    return new AllowedFilter(name, column ?? name, FilterOperator.PARTIAL);
  }

  /**
   * Create a custom scope filter with full control over the query.
   *
   * @param name - Filter name in query string
   * @param fn - Custom filter function
   *
   * @example
   * AllowedFilter.scope('search', (qb, value, alias) => {
   *   qb.andWhere(`(${alias}.name ILIKE :s OR ${alias}.email ILIKE :s)`, { s: `%${value}%` });
   * })
   */
  static scope<T extends ObjectLiteral = any>(
    name: string,
    fn: FilterApplyFn<T>,
  ): AllowedFilter<T> {
    return new AllowedFilter(name, name, FilterOperator.SCOPE, fn);
  }

  /**
   * Apply this filter to the query builder.
   * @internal Called by QueryBuilder — not intended for direct use.
   */
  apply(
    qb: SelectQueryBuilder<T>,
    alias: string,
    value: any,
    paramIndex: number,
  ): void {
    if (value === undefined || value === null || value === '') return;

    const paramName = `qb_f_${this.column.replace(/\W/g, '_')}_${paramIndex}`;

    switch (this.operator) {
      case FilterOperator.EXACT: {
        if (Array.isArray(value)) {
          qb.andWhere(`${alias}.${this.column} IN (:...${paramName})`, {
            [paramName]: value,
          });
        } else {
          qb.andWhere(`${alias}.${this.column} = :${paramName}`, {
            [paramName]: value,
          });
        }
        break;
      }

      case FilterOperator.PARTIAL: {
        if (Array.isArray(value)) {
          const conditions = value.map(
            (_: any, i: number) =>
              `${alias}.${this.column} ILIKE :${paramName}_${i}`,
          );
          const params: Record<string, string> = {};
          value.forEach((v: string, i: number) => {
            params[`${paramName}_${i}`] = `%${v}%`;
          });
          qb.andWhere(`(${conditions.join(' OR ')})`, params);
        } else {
          qb.andWhere(`${alias}.${this.column} ILIKE :${paramName}`, {
            [paramName]: `%${value}%`,
          });
        }
        break;
      }

      case FilterOperator.SCOPE: {
        this.scopeFn?.(qb, value, alias);
        break;
      }
    }
  }
}
