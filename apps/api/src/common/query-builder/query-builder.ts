import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import qs from 'qs';
import {
  Paginated,
  PaginatedLinks,
  PaginatedMeta,
} from '../dto/offset-pagination/paginated.dto';
import { AllowedFilter } from './allowed-filter';
import { AllowedInclude } from './allowed-include';
import { AllowedSort } from './allowed-sort';
import {
  getGlobalConfig,
  QueryBuilderConfig,
  QueryBuilderUserConfig,
  setGlobalConfig,
} from './config';
import {
  InvalidFieldQueryException,
  InvalidFilterQueryException,
  InvalidIncludeQueryException,
  InvalidSortQueryException,
} from './exceptions';
import { QueryParams } from './types';

/**
 * A fluent, feature-complete query builder for TypeORM.
 *
 * Provides a clean, secure, whitelist-based API for filtering, sorting,
 * including relations, sparse fieldsets, and paginating TypeORM queries.
 *
 * @example
 * ```ts
 * // Configure globally (optional, e.g. in main.ts)
 * QueryBuilder.configure({
 *   strictMode: true,
 *   defaultLimit: 20,
 * });
 *
 * // In your service
 * async findAll(query: QueryParams) {
 *   return QueryBuilder.for(this.userRepo, query)
 *     .allowedFilters([
 *       'name',                                      // partial (ILIKE)
 *       AllowedFilter.exact('status'),               // exact (=)
 *       AllowedFilter.startsWith('code'),            // prefix (INV%)
 *       AllowedFilter.operator('minAge', '>=', 'age'), // comparison
 *       AllowedFilter.trashed(),                     // soft deletes (with/only/without)
 *       AllowedFilter.scope('search', (qb, val, a) => ...),
 *     ])
 *     .allowedSorts(['id', 'name', 'createdAt'])
 *     .defaultSort('-createdAt')
 *     .allowedIncludes(['roles', 'profile', AllowedInclude.count('comments')])
 *     .allowedFields(['id', 'name', 'email', 'roles.id', 'roles.name'])
 *     .strict(true)
 *     .paginate();
 * }
 * ```
 */
export class QueryBuilder<T extends ObjectLiteral> {
  private readonly qb: SelectQueryBuilder<T>;
  private readonly alias: string;
  private readonly query: QueryParams;
  private readonly config: QueryBuilderConfig;

  private _filters: AllowedFilter<T>[] = [];
  private _sorts: AllowedSort<T>[] = [];
  private _includes: AllowedInclude<T>[] = [];
  private _fields: string[] = [];
  private _defaultSortStr?: string;
  private _defaultLimit: number;
  private _maxLimit: number;
  private _strictMode: boolean;
  private _joinedAliases = new Set<string>();
  private _built = false;
  private _filterIndex = 0;

  private constructor(qb: SelectQueryBuilder<T>, query: QueryParams) {
    this.qb = qb;
    this.alias = qb.alias;
    this.query = query;
    this.config = getGlobalConfig();

    this._defaultLimit = this.config.defaultLimit;
    this._maxLimit = this.config.maxLimit;
    this._strictMode = this.config.strictMode;
  }

  /**
   * Globally configure QueryBuilder defaults.
   */
  static configure(config: QueryBuilderUserConfig): QueryBuilderConfig {
    return setGlobalConfig(config);
  }

  /**
   * Create a new QueryBuilder from a Repository or existing SelectQueryBuilder.
   *
   * @param source - TypeORM Repository or SelectQueryBuilder
   * @param query - Parsed query parameters from the request
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
   * Enable or disable strict mode for this query.
   * In strict mode, an exception is thrown when the client requests
   * an unallowed filter, sort, include, or field.
   */
  strict(enabled = true): this {
    this._strictMode = enabled;
    return this;
  }

  /**
   * Define the allowed filters for this query.
   * Strings default to **partial** (ILIKE) filters.
   */
  allowedFilters(filters: (string | AllowedFilter<T>)[]): this {
    this._filters = filters.map((f) =>
      typeof f === 'string' ? AllowedFilter.partial<T>(f) : f,
    );
    return this;
  }

  /**
   * Define the allowed sorts for this query.
   * Strings default to column sorts. Use `-` prefix for descending order.
   */
  allowedSorts(sorts: (string | AllowedSort<T>)[]): this {
    this._sorts = sorts.map((s) =>
      typeof s === 'string' ? AllowedSort.field<T>(s) : s,
    );
    return this;
  }

  /**
   * Set the default sort when no sort parameter is provided.
   */
  defaultSort(sort: string): this {
    this._defaultSortStr = sort;
    return this;
  }

  /**
   * Define the allowed includes (relations) for this query.
   * Strings default to `leftJoinAndSelect`.
   */
  allowedIncludes(includes: (string | AllowedInclude<T>)[]): this {
    this._includes = includes.map((i) =>
      typeof i === 'string' ? AllowedInclude.relationship<T>(i) : i,
    );
    return this;
  }

  /**
   * Define the allowed fields (sparse fieldsets) for this query.
   * Frontend: ?fields=id,name or ?fields[user]=id,name&fields[roles]=id,title
   *
   * @example
   * .allowedFields(['id', 'name', 'email', 'roles.id', 'roles.title'])
   */
  allowedFields(fields: string[]): this {
    this._fields = fields;
    return this;
  }

  /**
   * Override default and maximum limit for pagination.
   */
  setLimit(defaultLimit: number, maxLimit?: number): this {
    this._defaultLimit = defaultLimit;
    if (maxLimit !== undefined) this._maxLimit = maxLimit;
    return this;
  }

  /**
   * Add a direct WHERE clause that is always applied, regardless of query params.
   */
  where(condition: string, parameters?: Record<string, any>): this {
    this.qb.andWhere(condition, parameters);
    return this;
  }

  // ─── TERMINAL METHODS (Execute) ─────────────────────────

  /**
   * Execute the query with offset pagination adhering to the nestjs-paginate standard.
   *
   * Returns a response matching `{ data: T[], meta: PaginatedMeta, links: PaginatedLinks }`.
   *
   * @param options - Default limit or pagination options { defaultLimit?: number; path?: string }
   */
  async paginate(
    options?: number | { defaultLimit?: number; path?: string },
  ): Promise<Paginated<T>> {
    this.build();

    const overrideDefault =
      typeof options === 'number' ? options : options?.defaultLimit;
    const limit = this.resolveLimit(overrideDefault);
    const page = this.resolvePage();
    const offset = (page - 1) * limit;

    this.qb.skip(offset).take(limit);

    const [entities, totalRecords] = await this.qb.getManyAndCount();

    const totalPages = limit > 0 ? Math.ceil(totalRecords / limit) : 1;
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const sortBy = this.resolveSortBy();
    const search =
      typeof this.query.search === 'string' && this.query.search.trim()
        ? this.query.search.trim()
        : undefined;
    const select = this.resolveSelectFields();
    const filter =
      typeof this.query[this.config.parameters.filter] === 'object' &&
      this.query[this.config.parameters.filter] !== null
        ? (this.query[this.config.parameters.filter] as Record<
            string,
            string | string[]
          >)
        : undefined;

    const meta: PaginatedMeta<T> = {
      itemsPerPage: limit,
      totalItems: totalRecords,
      currentPage,
      totalPages,
      sortBy,
      search,
      select,
      filter,
    };

    const basePath = this.resolveBasePath(options);

    const buildLink = (targetPage: number): string => {
      const q: Record<string, any> = { ...this.query };
      delete q.path;
      q[this.config.parameters.page] = targetPage;
      q[this.config.parameters.limit] = limit;

      const queryString = qs.stringify(q, {
        encode: false,
        arrayFormat: 'brackets',
        filter: (_prefix, value) => (value === undefined ? undefined : value),
      });

      return basePath ? `${basePath}?${queryString}` : `?${queryString}`;
    };

    const links: PaginatedLinks = {
      first: currentPage === 1 ? undefined : buildLink(1),
      previous: currentPage - 1 < 1 ? undefined : buildLink(currentPage - 1),
      current: buildLink(currentPage),
      next:
        currentPage + 1 > totalPages ? undefined : buildLink(currentPage + 1),
      last:
        currentPage === totalPages || totalRecords === 0
          ? undefined
          : buildLink(totalPages),
    };

    return new Paginated<T>(entities, meta, links);
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
   */
  getQueryBuilder(): SelectQueryBuilder<T> {
    this.build();
    return this.qb;
  }

  // ─── INTERNAL BUILD PROCESS ─────────────────────────────

  private build(): void {
    if (this._built) return;
    this._built = true;

    this.applyFields();
    this.applyIncludes();
    this.applyFilters();
    this.applySorts();
  }

  private resolveBasePath(
    options?: number | { defaultLimit?: number; path?: string },
  ): string {
    if (typeof this.query.path === 'string') {
      return this.query.path;
    }
    if (typeof options === 'object' && options?.path) {
      return options.path;
    }
    return '';
  }

  private parseScopedFieldValues(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String);
    }
    if (typeof value === 'string') {
      return value.split(',');
    }
    return [];
  }

  private applyFields(): void {
    const fieldsParam = this.query[this.config.parameters.fields];
    if (!fieldsParam) return;

    const requestedFields: string[] = [];

    if (typeof fieldsParam === 'string') {
      requestedFields.push(
        ...fieldsParam
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
      );
    } else if (typeof fieldsParam === 'object' && fieldsParam !== null) {
      for (const [scope, value] of Object.entries(fieldsParam)) {
        const valArr = this.parseScopedFieldValues(value);
        for (const rawField of valArr) {
          const field = rawField.trim();
          if (!field) continue;
          if (scope === this.alias || scope === `${this.alias}s`) {
            requestedFields.push(field);
          } else {
            requestedFields.push(
              field.includes('.') ? field : `${scope}.${field}`,
            );
          }
        }
      }
    }

    if (requestedFields.length === 0) return;

    if (this._fields.length === 0) {
      if (this._strictMode) {
        throw new InvalidFieldQueryException(requestedFields, []);
      }
      return;
    }

    // Strict mode validation
    if (this._strictMode) {
      const allowedSet = new Set(this._fields);
      const invalid = requestedFields.filter((f) => !allowedSet.has(f));
      if (invalid.length > 0) {
        throw new InvalidFieldQueryException(invalid, this._fields);
      }
    }

    const validFields = requestedFields.filter((f) => this._fields.includes(f));

    if (validFields.length === 0) return;

    const rootFields: string[] = [];
    const relationFields: string[] = [];

    for (const f of validFields) {
      if (f.includes('.')) {
        relationFields.push(f);
      } else {
        rootFields.push(`${this.alias}.${f}`);
      }
    }

    if (rootFields.length > 0) {
      this.qb.select(rootFields);
    }
    if (relationFields.length > 0) {
      if (rootFields.length > 0) {
        this.qb.addSelect(relationFields);
      } else {
        this.qb.select(relationFields);
      }
    }
  }

  private applyFilters(): void {
    const filterParams = this.query[this.config.parameters.filter];
    if (!filterParams || typeof filterParams !== 'object') return;

    const allowedMap = new Map(this._filters.map((f) => [f.name, f]));
    const allowedNames = Array.from(allowedMap.keys());

    // Strict mode validation
    if (this._strictMode) {
      const invalid = Object.keys(filterParams).filter(
        (k) => !allowedMap.has(k),
      );
      if (invalid.length > 0) {
        throw new InvalidFilterQueryException(invalid, allowedNames);
      }
    }

    for (const [key, value] of Object.entries(filterParams)) {
      const filter = allowedMap.get(key);
      if (!filter) continue;

      filter.apply(this.qb, this.alias, value, this._filterIndex++);
    }
  }

  private applySorts(): void {
    const sortParam = this.query[this.config.parameters.sort];
    const sortMap = new Map(this._sorts.map((s) => [s.name, s]));
    const allowedNames = Array.from(sortMap.keys());

    if (sortParam && typeof sortParam === 'string') {
      const parts = sortParam.split(',').filter(Boolean);
      const invalid: string[] = [];
      let isFirst = true;

      for (const part of parts) {
        const trimmed = part.trim();
        const isDesc = trimmed.startsWith('-');
        const name = isDesc ? trimmed.slice(1) : trimmed;
        const direction: 'ASC' | 'DESC' = isDesc ? 'DESC' : 'ASC';

        const sort = sortMap.get(name);
        if (!sort) {
          invalid.push(name);
          continue;
        }

        sort.apply(this.qb, this.alias, direction, isFirst);
        isFirst = false;
      }

      if (this._strictMode && invalid.length > 0) {
        throw new InvalidSortQueryException(invalid, allowedNames);
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
        const target = name.includes('.') ? name : `${this.alias}.${name}`;
        if (isFirst) {
          this.qb.orderBy(target, direction);
        } else {
          this.qb.addOrderBy(target, direction);
        }
      }
      isFirst = false;
    }
  }

  private applyIncludes(): void {
    const includeParam = this.query[this.config.parameters.include];
    if (!includeParam || typeof includeParam !== 'string') return;

    const allowedMap = new Map(this._includes.map((i) => [i.name, i]));
    const allowedNames = Array.from(allowedMap.keys());
    const parts = includeParam
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (this._strictMode) {
      const invalid = parts.filter((p) => !allowedMap.has(p));
      if (invalid.length > 0) {
        throw new InvalidIncludeQueryException(invalid, allowedNames);
      }
    }

    for (const name of parts) {
      const include = allowedMap.get(name);
      if (!include) continue;

      include.apply(
        this.qb,
        this.alias,
        this._joinedAliases,
        this.config.countSuffix,
      );
    }
  }

  private resolveSortBy(): [string, 'ASC' | 'DESC'][] {
    const sortParam = this.query[this.config.parameters.sort];
    if (typeof sortParam === 'string' && sortParam.trim()) {
      return sortParam
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((part) => {
          const isDesc = part.startsWith('-');
          const col = isDesc ? part.slice(1) : part;
          return [col, isDesc ? 'DESC' : 'ASC'];
        });
    }

    if (this._defaultSortStr) {
      return this._defaultSortStr
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((part) => {
          const isDesc = part.startsWith('-');
          const col = isDesc ? part.slice(1) : part;
          return [col, isDesc ? 'DESC' : 'ASC'];
        });
    }

    return [];
  }

  private resolveSelectFields(): string[] | undefined {
    const fieldsParam = this.query[this.config.parameters.fields];
    if (typeof fieldsParam === 'string') {
      return fieldsParam
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
    }
    if (Array.isArray(fieldsParam)) {
      return fieldsParam.map(String).filter(Boolean);
    }
    return undefined;
  }

  private resolveLimit(overrideDefault?: number): number {
    const limitKey = this.config.parameters.limit;
    const raw = Number(this.query[limitKey]);
    const limit =
      Number.isFinite(raw) && raw > 0
        ? raw
        : (overrideDefault ?? this._defaultLimit);

    return Math.min(limit, this._maxLimit);
  }

  private resolvePage(): number {
    const pageKey = this.config.parameters.page;
    const raw = Number(this.query[pageKey]);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
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
