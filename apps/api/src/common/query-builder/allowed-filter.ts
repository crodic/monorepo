import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { FilterApplyFn, FilterInterface } from './types';

export enum FilterOperator {
  EXACT = 'exact',
  PARTIAL = 'partial',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  OPERATOR = 'operator',
  SCOPE = 'scope',
  CUSTOM = 'custom',
  TRASHED = 'trashed',
}

export type ComparisonOperator = '=' | '!=' | '<>' | '>' | '>=' | '<' | '<=';

export class AllowedFilter<T extends ObjectLiteral = any> {
  private constructor(
    /** Name used in the query string: ?filter[name]=... */
    public readonly name: string,
    /** Actual database column name (can be 'column' or 'relation.column') */
    public readonly column: string,
    /** Filter operator type */
    public readonly operator: FilterOperator,
    /** Custom scope function (only for SCOPE type) */
    public readonly scopeFn?: FilterApplyFn<T>,
    /** Comparison operator for OPERATOR type (e.g. '>=') */
    public readonly comparisonOp?: ComparisonOperator,
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
   * AllowedFilter.exact('roleName', 'role.name') // ?filter[roleName]=admin → WHERE role.name = 'admin'
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
   * Create a prefix match filter (WHERE col ILIKE value%).
   *
   * @param name - Filter name in query string
   * @param column - Database column name (defaults to name)
   *
   * @example
   * AllowedFilter.startsWith('code')          // ?filter[code]=INV → ILIKE 'INV%'
   */
  static startsWith<T extends ObjectLiteral = any>(
    name: string,
    column?: string,
  ): AllowedFilter<T> {
    return new AllowedFilter(name, column ?? name, FilterOperator.STARTS_WITH);
  }

  /**
   * Create a suffix match filter (WHERE col ILIKE %value).
   *
   * @param name - Filter name in query string
   * @param column - Database column name (defaults to name)
   *
   * @example
   * AllowedFilter.endsWith('domain')          // ?filter[domain]=.com → ILIKE '%.com'
   */
  static endsWith<T extends ObjectLiteral = any>(
    name: string,
    column?: string,
  ): AllowedFilter<T> {
    return new AllowedFilter(name, column ?? name, FilterOperator.ENDS_WITH);
  }

  /**
   * Create a comparison operator filter (WHERE col > value, etc.).
   *
   * @param name - Filter name in query string
   * @param op - Comparison operator ('=', '!=', '<>', '>', '>=', '<', '<=')
   * @param column - Database column name (defaults to name)
   *
   * @example
   * AllowedFilter.operator('minAge', '>=', 'age') // ?filter[minAge]=18 → age >= 18
   * AllowedFilter.operator('maxPrice', '<=', 'price')
   */
  static operator<T extends ObjectLiteral = any>(
    name: string,
    op: ComparisonOperator,
    column?: string,
  ): AllowedFilter<T> {
    return new AllowedFilter(
      name,
      column ?? name,
      FilterOperator.OPERATOR,
      undefined,
      op,
    );
  }

  /**
   * Create a custom filter using a callback function or a class implementing FilterInterface.
   * Matches Spatie's `AllowedFilter::custom(...)`.
   *
   * @param name - Filter name in query string
   * @param filterClassOrFn - Function callback or FilterInterface instance
   * @param column - Optional database column/property name (defaults to name)
   *
   * @example
   * // Function callback:
   * AllowedFilter.custom('search', (qb, value, alias) => {
   *   qb.andWhere(`(${alias}.name ILIKE :s OR ${alias}.email ILIKE :s)`, { s: `%${value}%` });
   * })
   *
   * // Class-based (Spatie style):
   * class FullNameFilter implements FilterInterface {
   *   apply(qb, value, alias) {
   *     qb.andWhere(`CONCAT(${alias}.firstName, ' ', ${alias}.lastName) ILIKE :val`, { val: `%${value}%` });
   *   }
   * }
   * AllowedFilter.custom('name', new FullNameFilter())
   */
  static custom<T extends ObjectLiteral = any>(
    name: string,
    filterClassOrFn: FilterApplyFn<T> | FilterInterface<T>,
    column?: string,
  ): AllowedFilter<T> {
    const fn: FilterApplyFn<T> =
      typeof filterClassOrFn === 'function'
        ? (filterClassOrFn as FilterApplyFn<T>)
        : (qb, val, alias) =>
            filterClassOrFn.apply(qb, val, alias, column ?? name);

    return new AllowedFilter(name, column ?? name, FilterOperator.CUSTOM, fn);
  }

  /**
   * Create a custom scope filter with full control over the query.
   * Alias for custom() matching named scope semantics.
   *
   * @param name - Filter name in query string
   * @param fn - Custom filter function
   */
  static scope<T extends ObjectLiteral = any>(
    name: string,
    fn: FilterApplyFn<T>,
  ): AllowedFilter<T> {
    return AllowedFilter.custom(name, fn);
  }

  /**
   * Filter soft-deleted entities.
   * - ?filter[trashed]=with     -> includes deleted records (withDeleted())
   * - ?filter[trashed]=only     -> only deleted records (withDeleted() AND deletedAt IS NOT NULL)
   * - ?filter[trashed]=without  -> normal records (default TypeORM behavior)
   *
   * @param name - Filter name in query string (defaults to 'trashed')
   * @param column - Column name for deleted timestamp (defaults to 'deletedAt')
   *
   * @example
   * AllowedFilter.trashed()                   // ?filter[trashed]=only
   */
  static trashed<T extends ObjectLiteral = any>(
    name = 'trashed',
    column = 'deletedAt',
  ): AllowedFilter<T> {
    return new AllowedFilter(name, column, FilterOperator.TRASHED);
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

    const target = this.column.includes('.')
      ? this.column
      : `${alias}.${this.column}`;

    const paramName = `qb_f_${this.column.replace(/\W/g, '_')}_${paramIndex}`;

    switch (this.operator) {
      case FilterOperator.EXACT: {
        if (Array.isArray(value)) {
          qb.andWhere(`${target} IN (:...${paramName})`, {
            [paramName]: value,
          });
        } else {
          qb.andWhere(`${target} = :${paramName}`, {
            [paramName]: value,
          });
        }
        break;
      }

      case FilterOperator.PARTIAL: {
        if (Array.isArray(value)) {
          const conditions = value.map(
            (_: any, i: number) => `${target} ILIKE :${paramName}_${i}`,
          );
          const params: Record<string, string> = {};
          value.forEach((v: string, i: number) => {
            params[`${paramName}_${i}`] = `%${v}%`;
          });
          qb.andWhere(`(${conditions.join(' OR ')})`, params);
        } else {
          qb.andWhere(`${target} ILIKE :${paramName}`, {
            [paramName]: `%${value}%`,
          });
        }
        break;
      }

      case FilterOperator.STARTS_WITH: {
        qb.andWhere(`${target} ILIKE :${paramName}`, {
          [paramName]: `${value}%`,
        });
        break;
      }

      case FilterOperator.ENDS_WITH: {
        qb.andWhere(`${target} ILIKE :${paramName}`, {
          [paramName]: `%${value}`,
        });
        break;
      }

      case FilterOperator.OPERATOR: {
        const op = this.comparisonOp ?? '=';
        qb.andWhere(`${target} ${op} :${paramName}`, {
          [paramName]: value,
        });
        break;
      }

      case FilterOperator.CUSTOM:
      case FilterOperator.SCOPE: {
        this.scopeFn?.(qb, value, alias);
        break;
      }

      case FilterOperator.TRASHED: {
        const strVal = String(value).toLowerCase();
        if (typeof (qb as any).withDeleted === 'function') {
          if (strVal === 'with') {
            qb.withDeleted();
          } else if (strVal === 'only') {
            qb.withDeleted();
            qb.andWhere(`${target} IS NOT NULL`);
          }
        }
        break;
      }
    }
  }
}
