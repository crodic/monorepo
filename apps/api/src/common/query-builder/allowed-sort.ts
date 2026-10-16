import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { SortApplyFn, SortInterface } from './types';

export class AllowedSort<T extends ObjectLiteral = any> {
  private constructor(
    /** Name used in the query string: ?sort=name or ?sort=-name */
    public readonly name: string,
    /** Actual database column name (can be 'column' or 'relation.column') */
    public readonly column: string,
    /** Custom sort function */
    public readonly customFn?: SortApplyFn<T>,
  ) {}

  /**
   * Create a field-based sort.
   * This is the default when passing a plain string to allowedSorts().
   *
   * @param name - Sort name in query string
   * @param column - Database column name (defaults to name)
   *
   * @example
   * AllowedSort.field('date', 'createdAt')      // ?sort=-date → ORDER BY createdAt DESC
   * AllowedSort.field('role', 'roles.name')     // ?sort=role → ORDER BY roles.name ASC
   */
  static field<T extends ObjectLiteral = any>(
    name: string,
    column?: string,
  ): AllowedSort<T> {
    return new AllowedSort(name, column ?? name);
  }

  /**
   * Create a custom sort using a callback function or a class implementing SortInterface.
   * Matches Spatie's `AllowedSort::custom(...)`.
   *
   * @param name - Sort name in query string
   * @param sortClassOrFn - Function callback or SortInterface instance
   *
   * @example
   * // Function callback:
   * AllowedSort.custom('popularity', (qb, dir, alias) => {
   *   qb.addOrderBy(`${alias}.viewCount + ${alias}.likeCount`, dir);
   * })
   *
   * // Class-based (Spatie style):
   * class PopularitySort implements SortInterface {
   *   apply(qb, dir, alias) {
   *     qb.addOrderBy(`${alias}.views + ${alias}.likes`, dir);
   *   }
   * }
   * AllowedSort.custom('popularity', new PopularitySort())
   */
  static custom<T extends ObjectLiteral = any>(
    name: string,
    sortClassOrFn: SortApplyFn<T> | SortInterface<T>,
  ): AllowedSort<T> {
    const fn: SortApplyFn<T> =
      typeof sortClassOrFn === 'function'
        ? (sortClassOrFn as SortApplyFn<T>)
        : (qb, dir, alias) => sortClassOrFn.apply(qb, dir, alias, name);

    return new AllowedSort(name, name, fn);
  }

  /**
   * Create a custom sort with full control over the query.
   * Alias for custom().
   */
  static callback<T extends ObjectLiteral = any>(
    name: string,
    fn: SortApplyFn<T>,
  ): AllowedSort<T> {
    return AllowedSort.custom(name, fn);
  }

  /**
   * Apply this sort to the query builder.
   * @param isFirst - Whether this is the first ORDER BY clause (uses orderBy vs addOrderBy)
   * @internal Called by QueryBuilder — not intended for direct use.
   */
  apply(
    qb: SelectQueryBuilder<T>,
    alias: string,
    direction: 'ASC' | 'DESC',
    isFirst: boolean,
  ): void {
    if (this.customFn) {
      this.customFn(qb, direction, alias);
      return;
    }

    const target = this.column.includes('.')
      ? this.column
      : `${alias}.${this.column}`;

    if (isFirst) {
      qb.orderBy(target, direction);
    } else {
      qb.addOrderBy(target, direction);
    }
  }
}
