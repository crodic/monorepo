import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { SortApplyFn } from './types';

export class AllowedSort<T extends ObjectLiteral = any> {
  private constructor(
    /** Name used in the query string: ?sort=name or ?sort=-name */
    public readonly name: string,
    /** Actual database column name */
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
   * AllowedSort.field('date', 'createdAt')  // ?sort=-date → ORDER BY createdAt DESC
   */
  static field<T extends ObjectLiteral = any>(
    name: string,
    column?: string,
  ): AllowedSort<T> {
    return new AllowedSort(name, column ?? name);
  }

  /**
   * Create a custom sort with full control over the query.
   *
   * @example
   * AllowedSort.callback('popularity', (qb, dir, alias) => {
   *   qb.addOrderBy(`${alias}.viewCount + ${alias}.likeCount`, dir);
   * })
   */
  static callback<T extends ObjectLiteral = any>(
    name: string,
    fn: SortApplyFn<T>,
  ): AllowedSort<T> {
    return new AllowedSort(name, name, fn);
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

    if (isFirst) {
      qb.orderBy(`${alias}.${this.column}`, direction);
    } else {
      qb.addOrderBy(`${alias}.${this.column}`, direction);
    }
  }
}
