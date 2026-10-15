import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PAGE_LIMIT,
} from '../constants/app.constant';
import { OffsetPaginatedDto } from '../dto/offset-pagination/paginated.dto';
import { OffsetPaginationDto } from '../dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto } from '../dto/offset-pagination/page-options.dto';
import { AllowedFilter } from './allowed-filter';
import { AllowedInclude } from './allowed-include';
import { AllowedSort } from './allowed-sort';
import { QueryParams } from './types';

/**
 * A fluent query builder inspired by Spatie's Laravel QueryBuilder.
 *
 * Provides a clean, secure, whitelist-based API for filtering, sorting,
 * including relations, and paginating TypeORM queries from HTTP request parameters.
 *
 * @example
 * ```ts
 * // In your controller
 * @Get()
 * findAll(@Query() query: QueryParams) {
 *   return this.userService.findAll(query);
 * }
 *
 * // In your service
 * async findAll(query: QueryParams) {
 *   return QueryBuilder.for(this.userRepo, query)
 *     .allowedFilters([
 *       'name',                                    // partial (ILIKE)
 *       AllowedFilter.exact('status'),             // exact (=)
 *       AllowedFilter.scope('search', (qb, value, alias) => {
 *         qb.andWhere(`(${alias}.name ILIKE :s OR ${alias}.email ILIKE :s)`, { s: `%${value}%` });
 *       }),
 *     ])
 *     .allowedSorts(['id', 'name', 'createdAt'])
 *     .defaultSort('-createdAt')
 *     .allowedIncludes(['roles', 'profile'])
 *     .paginate();
 * }
 * ```
 *
 * Frontend URL format:
 * ```
 * GET /api/v1/users?filter[name]=john&filter[status]=active&sort=-createdAt,name&include=roles&page=2&limit=15
 * ```
 */
export class QueryBuilder<T extends ObjectLiteral> {
  private readonly qb: SelectQueryBuilder<T>;
  private readonly alias: string;
  private readonly query: QueryParams;

  private _filters: AllowedFilter<T>[] = [];
  private _sorts: AllowedSort<T>[] = [];
  private _includes: AllowedInclude<T>[] = [];
  private _defaultSortStr?: string;
  private _defaultLimit: number = DEFAULT_PAGE_LIMIT;
  private _maxLimit = 100;
  private _built = false;
  private _filterIndex = 0;

  private constructor(qb: SelectQueryBuilder<T>, query: QueryParams) {
    this.qb = qb;
    this.alias = qb.alias;
    this.query = query;
  }

  /**
   * Create a new QueryBuilder from a Repository or existing SelectQueryBuilder.
   *
   * @param source - TypeORM Repository or SelectQueryBuilder
   * @param query - Parsed query parameters from the request
   *
   * @example
   * // From repository (auto-generates alias from entity name)
   * QueryBuilder.for(this.userRepo, query)
   *
   * // From existing query builder (uses its alias)
   * QueryBuilder.for(this.userRepo.createQueryBuilder('u'), query)
   */
  static for<T extends ObjectLiteral>(
    source: Repository<T> | SelectQueryBuilder<T>,
    query: QueryParams | Record<string, any> = {},
  ): QueryBuilder<T> {
    let qb: SelectQueryBuilder<T>;

    if (isRepository(source)) {
      const entityName = source.metadata.targetName;
      const alias = entityName
        .replace(/Entity$/i, '')
        .replace(/^./, (c) => c.toLowerCase());
      qb = source.createQueryBuilder(alias);
    } else {
      qb = source;
    }

    return new QueryBuilder<T>(qb, query as QueryParams);
  }

  // ─── CONFIGURATION (Fluent API) ─────────────────────────

  /**
   * Define the allowed filters for this query.
   * Strings default to **partial** (ILIKE) filters.
   * Unrecognized filter keys from the request are silently ignored (security).
   *
   * @example
   * .allowedFilters([
   *   'name',                              // partial match (ILIKE)
   *   AllowedFilter.exact('status'),       // exact match (=)
   *   AllowedFilter.scope('search', fn),   // custom scope
   * ])
   */
  allowedFilters(filters: (string | AllowedFilter<T>)[]): this {
    this._filters = filters.map((f) =>
      typeof f === 'string' ? AllowedFilter.partial<T>(f) : f,
    );
    return this;
  }

  /**
   * Define the allowed sorts for this query.
   * Strings default to column sorts.
   * Use `-` prefix in the query string for descending order.
   * Unrecognized sort keys from the request are silently ignored (security).
   *
   * @example
   * .allowedSorts(['id', 'name', 'createdAt'])
   * // Frontend: ?sort=-createdAt,name → ORDER BY createdAt DESC, name ASC
   */
  allowedSorts(sorts: (string | AllowedSort<T>)[]): this {
    this._sorts = sorts.map((s) =>
      typeof s === 'string' ? AllowedSort.field<T>(s) : s,
    );
    return this;
  }

  /**
   * Set the default sort when no `?sort=` parameter is provided.
   * Supports `-` prefix for descending and comma-separated multiple sorts.
   *
   * @example
   * .defaultSort('-createdAt')        // newest first
   * .defaultSort('-createdAt,name')   // newest first, then by name
   */
  defaultSort(sort: string): this {
    this._defaultSortStr = sort;
    return this;
  }

  /**
   * Define the allowed includes (relations) for this query.
   * Strings default to `leftJoinAndSelect`.
   * Unrecognized include keys from the request are silently ignored (security).
   *
   * @example
   * .allowedIncludes(['roles', 'profile'])
   * .allowedIncludes([AllowedInclude.count('comments')])
   * // Frontend: ?include=roles,profile
   */
  allowedIncludes(includes: (string | AllowedInclude<T>)[]): this {
    this._includes = includes.map((i) =>
      typeof i === 'string' ? AllowedInclude.relationship<T>(i) : i,
    );
    return this;
  }

  /**
   * Override default and maximum limit for pagination.
   *
   * @param defaultLimit - Default items per page (fallback: DEFAULT_PAGE_LIMIT)
   * @param maxLimit - Maximum items per page (fallback: 100)
   */
  setLimit(defaultLimit: number, maxLimit?: number): this {
    this._defaultLimit = defaultLimit;
    if (maxLimit !== undefined) this._maxLimit = maxLimit;
    return this;
  }

  /**
   * Add a direct WHERE clause that is always applied, regardless of query params.
   * Useful for tenant isolation, soft-delete scopes, or ownership checks.
   *
   * @example
   * .where('user.isActive = :active', { active: true })
   * .where('user.tenantId = :tenantId', { tenantId })
   */
  where(condition: string, parameters?: Record<string, any>): this {
    this.qb.andWhere(condition, parameters);
    return this;
  }

  // ─── TERMINAL METHODS (Execute) ─────────────────────────

  /**
   * Execute the query with offset pagination.
   * Returns data array and pagination metadata.
   *
   * @param defaultLimit - Override the default limit for this call
   */
  async paginate(defaultLimit?: number): Promise<OffsetPaginatedDto<T>> {
    this.build();

    const limit = this.resolveLimit(defaultLimit);
    const page = this.resolvePage();
    const offset = (page - 1) * limit;

    this.qb.skip(offset).take(limit);

    const [entities, totalRecords] = await this.qb.getManyAndCount();

    const pageOptions = Object.assign(new PageOptionsDto(), { limit, page });
    const meta = new OffsetPaginationDto(totalRecords, pageOptions);

    return new OffsetPaginatedDto(entities, meta);
  }

  /** Execute the query and return all matching entities. */
  async getMany(): Promise<T[]> {
    this.build();
    return this.qb.getMany();
  }

  /** Execute the query and return entities with total count. */
  async getManyAndCount(): Promise<[T[], number]> {
    this.build();
    return this.qb.getManyAndCount();
  }

  /** Execute the query and return the first matching entity or null. */
  async getOne(): Promise<T | null> {
    this.build();
    return this.qb.getOne();
  }

  /**
   * Get the underlying TypeORM SelectQueryBuilder after applying all configurations.
   * Useful for adding custom conditions before executing.
   */
  getQueryBuilder(): SelectQueryBuilder<T> {
    this.build();
    return this.qb;
  }

  // ─── INTERNAL ───────────────────────────────────────────

  private build(): void {
    if (this._built) return;
    this._built = true;

    this.applyIncludes();
    this.applyFilters();
    this.applySorts();
  }

  private applyFilters(): void {
    const filterParams = this.query.filter;
    if (!filterParams || typeof filterParams !== 'object') return;

    const allowedMap = new Map(this._filters.map((f) => [f.name, f]));

    for (const [key, value] of Object.entries(filterParams)) {
      const filter = allowedMap.get(key);
      if (!filter) continue; // silently ignore unallowed filters

      filter.apply(this.qb, this.alias, value, this._filterIndex++);
    }
  }

  private applySorts(): void {
    const sortParam = this.query.sort;
    const sortMap = new Map(this._sorts.map((s) => [s.name, s]));

    if (sortParam && typeof sortParam === 'string') {
      const parts = sortParam.split(',').filter(Boolean);
      let isFirst = true;

      for (const part of parts) {
        const trimmed = part.trim();
        const isDesc = trimmed.startsWith('-');
        const name = isDesc ? trimmed.slice(1) : trimmed;
        const direction: 'ASC' | 'DESC' = isDesc ? 'DESC' : 'ASC';

        const sort = sortMap.get(name);
        if (!sort) continue; // silently ignore unallowed sorts

        sort.apply(this.qb, this.alias, direction, isFirst);
        isFirst = false;
      }

      if (!isFirst) return; // at least one sort was applied
    }

    // fallback to default sort
    if (this._defaultSortStr) {
      this.applyDefaultSort(sortMap);
    }
  }

  private applyDefaultSort(sortMap: Map<string, AllowedSort<T>>): void {
    const parts = this._defaultSortStr!.split(',').filter(Boolean);
    let isFirst = true;

    for (const part of parts) {
      const trimmed = part.trim();
      const isDesc = trimmed.startsWith('-');
      const name = isDesc ? trimmed.slice(1) : trimmed;
      const direction: 'ASC' | 'DESC' = isDesc ? 'DESC' : 'ASC';

      const sort = sortMap.get(name);
      if (sort) {
        sort.apply(this.qb, this.alias, direction, isFirst);
      } else {
        // default sort can reference any column directly
        if (isFirst) {
          this.qb.orderBy(`${this.alias}.${name}`, direction);
        } else {
          this.qb.addOrderBy(`${this.alias}.${name}`, direction);
        }
      }
      isFirst = false;
    }
  }

  private applyIncludes(): void {
    const includeParam = this.query.include;
    if (!includeParam || typeof includeParam !== 'string') return;

    const allowedMap = new Map(this._includes.map((i) => [i.name, i]));
    const parts = includeParam.split(',').filter(Boolean);

    for (const part of parts) {
      const name = part.trim();
      const include = allowedMap.get(name);
      if (!include) continue; // silently ignore unallowed includes

      include.apply(this.qb, this.alias);
    }
  }

  private resolveLimit(overrideDefault?: number): number {
    const raw = Number(this.query.limit);
    const limit =
      Number.isFinite(raw) && raw > 0
        ? raw
        : (overrideDefault ?? this._defaultLimit);

    return Math.min(limit, this._maxLimit);
  }

  private resolvePage(): number {
    const raw = Number(this.query.page);
    return Number.isFinite(raw) && raw > 0
      ? Math.floor(raw)
      : DEFAULT_CURRENT_PAGE;
  }
}

// ─── HELPERS ────────────────────────────────────────────

function isRepository<T extends ObjectLiteral>(
  source: Repository<T> | SelectQueryBuilder<T>,
): source is Repository<T> {
  return (
    'target' in source && 'metadata' in source && 'createQueryBuilder' in source
  );
}
