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
    /** Whether this is a relation count */
    public readonly isCount = false,
  ) {}

  /**
   * Create a relationship include using leftJoinAndSelect.
   * Supports nested dot notation (e.g. 'posts.comments').
   * This is the default when passing a plain string to allowedIncludes().
   *
   * @param name - Include name in query string
   * @param relation - Entity relation property name (defaults to name)
   *
   * @example
   * AllowedInclude.relationship('roles')
   * AllowedInclude.relationship('comments', 'posts.comments')
   */
  static relationship<T extends ObjectLiteral = any>(
    name: string,
    relation?: string,
  ): AllowedInclude<T> {
    return new AllowedInclude(name, relation ?? name);
  }

  /**
   * Create a count include using loadRelationCountAndMap.
   * Maps the count to `{relation}{countSuffix}` property on the entity.
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
    return new AllowedInclude(name, rel, undefined, true);
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
  apply(
    qb: SelectQueryBuilder<T>,
    alias: string,
    joinedAliases?: Set<string>,
    countSuffix = 'Count',
  ): void {
    if (this.customFn) {
      this.customFn(qb, alias);
      return;
    }

    if (this.isCount) {
      const rel = this.relation;
      qb.loadRelationCountAndMap(
        `${alias}.${rel}${countSuffix}`,
        `${alias}.${rel}`,
      );
      return;
    }

    // Support nested dot relations: e.g. "posts.comments"
    const parts = this.relation.split('.');
    let currentParentAlias = alias;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const joinProperty = `${currentParentAlias}.${part}`;
      const joinAlias =
        parts.length === 1 ? part : parts.slice(0, i + 1).join('_');

      if (!joinedAliases?.has(joinAlias)) {
        qb.leftJoinAndSelect(joinProperty, joinAlias);
        joinedAliases?.add(joinAlias);
      }

      currentParentAlias = joinAlias;
    }
  }
}
