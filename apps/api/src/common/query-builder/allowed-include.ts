import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { IncludeApplyFn } from './types';

export class AllowedInclude<T extends ObjectLiteral = any> {
  private constructor(
    /** Name used in the query string: ?include=roles */
    public readonly name: string,
    /** Actual relation property name on the entity */
    public readonly relation: string,
    /** Custom include function */
    public readonly customFn?: IncludeApplyFn<T>,
  ) {}

  /**
   * Create a relationship include using leftJoinAndSelect.
   * This is the default when passing a plain string to allowedIncludes().
   *
   * @param name - Include name in query string
   * @param relation - Entity relation property name (defaults to name)
   *
   * @example
   * AllowedInclude.relationship('roles')
   * AllowedInclude.relationship('author', 'createdByUser')
   */
  static relationship<T extends ObjectLiteral = any>(
    name: string,
    relation?: string,
  ): AllowedInclude<T> {
    return new AllowedInclude(name, relation ?? name);
  }

  /**
   * Create a count include using loadRelationCountAndMap.
   * Maps the count to `{relation}Count` property on the entity.
   *
   * @param name - Include name in query string
   * @param relation - Entity relation property name (defaults to name)
   *
   * @example
   * AllowedInclude.count('comments')  // maps to entity.commentsCount
   */
  static count<T extends ObjectLiteral = any>(
    name: string,
    relation?: string,
  ): AllowedInclude<T> {
    const rel = relation ?? name;
    const fn: IncludeApplyFn<T> = (qb, alias) => {
      qb.loadRelationCountAndMap(`${alias}.${rel}Count`, `${alias}.${rel}`);
    };
    return new AllowedInclude(name, rel, fn);
  }

  /**
   * Create a custom include with full control.
   *
   * @example
   * AllowedInclude.callback('activeRoles', (qb, alias) => {
   *   qb.leftJoinAndSelect(`${alias}.roles`, 'role', 'role.isActive = true');
   * })
   */
  static callback<T extends ObjectLiteral = any>(
    name: string,
    fn: IncludeApplyFn<T>,
  ): AllowedInclude<T> {
    return new AllowedInclude(name, name, fn);
  }

  /**
   * Apply this include to the query builder.
   * @internal Called by QueryBuilder — not intended for direct use.
   */
  apply(qb: SelectQueryBuilder<T>, alias: string): void {
    if (this.customFn) {
      this.customFn(qb, alias);
      return;
    }

    qb.leftJoinAndSelect(`${alias}.${this.relation}`, this.relation);
  }
}
