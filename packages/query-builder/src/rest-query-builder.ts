/**
 * Direction for sorting queries: ascending or descending.
 */
export type RestSortDirection = "asc" | "desc" | "ASC" | "DESC";

/**
 * Trashed filter mode for soft-deletable models.
 * - 'with': Include both active and soft-deleted records
 * - 'only': Only return soft-deleted records
 * - 'without': Exclude soft-deleted records (default)
 */
export type RestTrashedMode = "with" | "only" | "without";

/**
 * Structured query parameters representing a RESTful query request.
 */
export interface RestQueryParams {
  filter?: Record<string, any>;
  sort?: string;
  include?: string;
  fields?: Record<string, string | string[]> | string;
  append?: string;
  page?: number | string | Record<string, number | string>;
  limit?: number | string;
  q?: string;
  [key: string]: any;
}

/**
 * Configuration options for RestQueryBuilder serialization.
 */
export interface RestBuilderOptions {
  /**
   * If true, pagination will serialize as `page[number]=1&page[size]=15`.
   * If false (default), pagination serializes as `page=1&limit=15`.
   */
  bracketPagination?: boolean;
  /**
   * Strategy used for formatting array filter values.
   * - 'comma' (default): `filter[status]=active,pending`
   * - 'bracket': `filter[status][]=active&filter[status][]=pending`
   */
  arrayFormat?: "comma" | "bracket";
}

/**
 * Fluent Query Builder for standard RESTful / JSON:API style APIs.
 *
 * Supports common REST query parameters:
 * - Filters: `filter[status]=active&filter[roles]=admin,editor`
 * - Sorts: `sort=-createdAt,name` (prefix '-' denotes descending)
 * - Includes: `include=roles,profile,commentsCount`
 * - Fields: `fields[user]=id,name&fields[roles]=id,title` or `fields=id,name`
 * - Appends: `append=fullName`
 * - Search: `q=keyword`
 * - Pagination: `page=1&limit=15` or `page[number]=1&page[size]=15`
 *
 * @example
 * ```ts
 * const query = new RestQueryBuilder()
 *   .filter('status', 'active')
 *   .filter('age', [18, 30])
 *   .sortBy('createdAt', 'desc')
 *   .include('roles', 'permissions')
 *   .fieldsFor('user', ['id', 'name', 'email'])
 *   .page(1)
 *   .limit(20)
 *   .toQueryString();
 * // => "filter[status]=active&filter[age]=18,30&sort=-createdAt&include=roles,permissions&fields[user]=id,name,email&page=1&limit=20"
 * ```
 */
export class RestQueryBuilder {
  private filterParams: Record<string, any> = {};
  private sortList: string[] = [];
  private includeList: string[] = [];
  private fieldParams: Record<string, string[]> = {};
  private flatFields: string[] = [];
  private appendList: string[] = [];
  private pageParam?: number;
  private limitParam?: number;
  private searchParam?: string;
  private extraParams: Record<string, any> = {};
  private options: RestBuilderOptions;

  constructor(
    initialParams?: RestQueryParams,
    options: RestBuilderOptions = {},
  ) {
    this.options = {
      bracketPagination: false,
      arrayFormat: "comma",
      ...options,
    };

    if (initialParams) {
      this.loadFromParams(initialParams);
    }
  }

  private isValidValue(val: any): boolean {
    if (val === undefined || val === null) return false;
    if (typeof val === "string" && val.trim() === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }

  private loadFromParams(params: RestQueryParams): void {
    if (!params || typeof params !== "object") return;

    if (params.filter && typeof params.filter === "object") {
      for (const key of Object.keys(params.filter)) {
        const val = params.filter[key];
        if (this.isValidValue(val)) {
          this.filterParams[key] = val;
        }
      }
    }

    if (typeof params.sort === "string" && params.sort.trim() !== "") {
      this.sortList = params.sort
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (typeof params.include === "string" && params.include.trim() !== "") {
      this.includeList = params.include
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (typeof params.append === "string" && params.append.trim() !== "") {
      this.appendList = params.append
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (typeof params.fields === "string" && params.fields.trim() !== "") {
      this.flatFields = params.fields
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (params.fields && typeof params.fields === "object") {
      for (const scope of Object.keys(params.fields)) {
        const fields = params.fields[scope];
        if (typeof fields === "string") {
          this.fieldParams[scope] = fields
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (Array.isArray(fields)) {
          this.fieldParams[scope] = fields.filter(
            (s: any): s is string => typeof s === "string" && s.trim() !== "",
          );
        }
      }
    }

    if (typeof params.page === "number" || typeof params.page === "string") {
      const p = Number(params.page);
      if (!Number.isNaN(p) && p > 0) this.pageParam = p;
    } else if (params.page && typeof params.page === "object") {
      const p = Number(params.page.number);
      if (!Number.isNaN(p) && p > 0) this.pageParam = p;
      const s = Number(params.page.size);
      if (!Number.isNaN(s) && s > 0) this.limitParam = s;
    }

    if (typeof params.limit === "number" || typeof params.limit === "string") {
      const l = Number(params.limit);
      if (!Number.isNaN(l) && l > 0) this.limitParam = l;
    }

    if (typeof params.q === "string" && params.q.trim() !== "") {
      this.searchParam = params.q.trim();
    }

    const knownKeys = new Set([
      "filter",
      "sort",
      "include",
      "fields",
      "append",
      "page",
      "limit",
      "q",
    ]);

    for (const key of Object.keys(params)) {
      if (!knownKeys.has(key) && this.isValidValue(params[key])) {
        this.extraParams[key] = params[key];
      }
    }
  }

  /**
   * Set builder configuration options.
   *
   * @param options Partial builder options
   * @returns The builder instance for chaining
   */
  public setOptions(options: Partial<RestBuilderOptions>): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Add a filter condition: `filter[name]=value`
   *
   * @param name Field or filter name
   * @param value Filter value or array of values
   * @returns The builder instance for chaining
   */
  public filter(name: string, value: any): this {
    if (!this.isValidValue(value)) {
      delete this.filterParams[name];
      return this;
    }

    if (Array.isArray(value)) {
      const filtered = value.filter((v) => this.isValidValue(v));
      if (filtered.length > 0) {
        this.filterParams[name] = filtered;
      } else {
        delete this.filterParams[name];
      }
      return this;
    }

    this.filterParams[name] = value;
    return this;
  }

  /**
   * Merge an object of filters: `.filters({ status: 'active', role: 'admin' })`
   *
   * @param filters Map of filter key-value pairs
   * @returns The builder instance for chaining
   */
  public filters(filters: Record<string, any>): this {
    for (const key of Object.keys(filters)) {
      this.filter(key, filters[key]);
    }
    return this;
  }

  /**
   * Exact match filter.
   *
   * @param name Field name
   * @param value Target value
   * @returns The builder instance for chaining
   */
  public filterExact(name: string, value: any): this {
    return this.filter(name, value);
  }

  /**
   * Partial match filter.
   *
   * @param name Field name
   * @param value Substring to match
   * @returns The builder instance for chaining
   */
  public filterPartial(name: string, value: any): this {
    return this.filter(name, value);
  }

  /**
   * Prefix match filter.
   *
   * @param name Field name
   * @param value Prefix string to match
   * @returns The builder instance for chaining
   */
  public filterStartsWith(name: string, value: any): this {
    return this.filter(name, value);
  }

  /**
   * Suffix match filter.
   *
   * @param name Field name
   * @param value Suffix string to match
   * @returns The builder instance for chaining
   */
  public filterEndsWith(name: string, value: any): this {
    return this.filter(name, value);
  }

  /**
   * Generic operator filter.
   *
   * @param name Field name
   * @param value Filter value
   * @returns The builder instance for chaining
   */
  public filterOperator(name: string, value: any): this {
    return this.filter(name, value);
  }

  /**
   * Custom scope filter: `.filterScope('search', 'john')`
   *
   * @param name Scope name
   * @param value Argument value for the scope
   * @returns The builder instance for chaining
   */
  public filterScope(name: string, value: any): this {
    return this.filter(name, value);
  }

  /**
   * Trashed filter for soft deletes: `filter[trashed]=with|only|without`
   *
   * @param mode Soft delete mode ('with', 'only', or 'without')
   * @returns The builder instance for chaining
   */
  public filterTrashed(mode: RestTrashedMode = "with"): this {
    return this.filter("trashed", mode);
  }

  /**
   * Add one or more sort fields: `.sort('-createdAt', 'name')`
   *
   * @param fields Field names (prefix with '-' for descending)
   * @returns The builder instance for chaining
   */
  public sort(...fields: string[]): this {
    for (const f of fields) {
      if (typeof f === "string" && f.trim() !== "") {
        const clean = f.trim();
        if (!this.sortList.includes(clean)) {
          this.sortList.push(clean);
        }
      }
    }
    return this;
  }

  /**
   * Add a single sort with explicit direction: `.sortBy('createdAt', 'desc')` -> `-createdAt`
   *
   * @param field Field name to sort on
   * @param direction 'asc' or 'desc'
   * @returns The builder instance for chaining
   */
  public sortBy(field: string, direction: RestSortDirection = "asc"): this {
    if (!field || typeof field !== "string") return this;
    const isDesc = direction.toLowerCase() === "desc";
    const sortKey = isDesc ? `-${field}` : field;

    // Remove existing sort for the same field if present
    this.sortList = this.sortList.filter(
      (s) => s !== field && s !== `-${field}`,
    );
    this.sortList.push(sortKey);
    return this;
  }

  /**
   * Clear all current sorts and set given sorts.
   *
   * @param fields Replacement sort fields
   * @returns The builder instance for chaining
   */
  public setSort(...fields: string[]): this {
    this.sortList = [];
    return this.sort(...fields);
  }

  /**
   * Include relationships: `include=roles,profile,commentsCount`
   *
   * @param relations Relationship paths to include
   * @returns The builder instance for chaining
   */
  public include(...relations: string[]): this {
    for (const r of relations) {
      if (typeof r === "string" && r.trim() !== "") {
        const clean = r.trim();
        if (!this.includeList.includes(clean)) {
          this.includeList.push(clean);
        }
      }
    }
    return this;
  }

  /**
   * Set root flat sparse fieldset: `fields=id,name,email`
   *
   * @param fields List of fields to select
   * @returns The builder instance for chaining
   */
  public fields(...fields: string[]): this {
    for (const f of fields) {
      if (typeof f === "string" && f.trim() !== "") {
        const clean = f.trim();
        if (!this.flatFields.includes(clean)) {
          this.flatFields.push(clean);
        }
      }
    }
    return this;
  }

  /**
   * Set scoped sparse fieldset: `fields[user]=id,name`
   *
   * @param scope Table or relation model name
   * @param fields Array or comma-delimited list of fields
   * @returns The builder instance for chaining
   */
  public fieldsFor(scope: string, fields: string[] | string): this {
    if (!scope || typeof scope !== "string") return this;
    const arr = Array.isArray(fields)
      ? fields
      : fields.split(",").map((s) => s.trim());
    const valid = arr.filter((s) => typeof s === "string" && s.trim() !== "");

    if (valid.length > 0) {
      this.fieldParams[scope] = valid;
    } else {
      delete this.fieldParams[scope];
    }
    return this;
  }

  /**
   * Add appends: `append=fullName,avatarUrl`
   *
   * @param appends Computed attributes to append
   * @returns The builder instance for chaining
   */
  public append(...appends: string[]): this {
    for (const a of appends) {
      if (typeof a === "string" && a.trim() !== "") {
        const clean = a.trim();
        if (!this.appendList.includes(clean)) {
          this.appendList.push(clean);
        }
      }
    }
    return this;
  }

  /**
   * Global search query: `q=keyword`
   *
   * @param query Search query text
   * @returns The builder instance for chaining
   */
  public search(query?: string): this {
    if (query && query.trim() !== "") {
      this.searchParam = query.trim();
    } else {
      this.searchParam = undefined;
    }
    return this;
  }

  /**
   * Set page number: `page=1` or `page[number]=1`
   *
   * @param page Target page number (>= 1)
   * @returns The builder instance for chaining
   */
  public page(page?: number): this {
    if (page && page > 0) {
      this.pageParam = page;
    } else {
      this.pageParam = undefined;
    }
    return this;
  }

  /**
   * Set page size / limit: `limit=15` or `page[size]=15`
   *
   * @param limit Items per page
   * @returns The builder instance for chaining
   */
  public limit(limit?: number): this {
    if (limit && limit > 0) {
      this.limitParam = limit;
    } else {
      this.limitParam = undefined;
    }
    return this;
  }

  /**
   * Alias for `.limit(limit)`
   *
   * @param limit Items per page
   * @returns The builder instance for chaining
   */
  public perPage(limit?: number): this {
    return this.limit(limit);
  }

  /**
   * Set both page and limit in a single call.
   *
   * @param page Target page number
   * @param limit Items per page
   * @returns The builder instance for chaining
   */
  public paginate(page?: number, limit?: number): this {
    this.page(page);
    this.limit(limit);
    return this;
  }

  /**
   * Add custom extra query parameter.
   *
   * @param key Parameter key
   * @param value Parameter value
   * @returns The builder instance for chaining
   */
  public param(key: string, value: any): this {
    if (this.isValidValue(value)) {
      this.extraParams[key] = value;
    } else {
      delete this.extraParams[key];
    }
    return this;
  }

  /**
   * Merge custom extra query parameters.
   *
   * @param params Key-value map of extra query parameters
   * @returns The builder instance for chaining
   */
  public params(params: Record<string, any>): this {
    for (const key of Object.keys(params)) {
      this.param(key, params[key]);
    }
    return this;
  }

  /**
   * Build clean structured query parameters object.
   *
   * @returns The structured query parameters object
   */
  public build(): RestQueryParams {
    const params: RestQueryParams = {};

    if (Object.keys(this.filterParams).length > 0) {
      params.filter = { ...this.filterParams };
    }

    if (this.sortList.length > 0) {
      params.sort = this.sortList.join(",");
    }

    if (this.includeList.length > 0) {
      params.include = this.includeList.join(",");
    }

    if (this.appendList.length > 0) {
      params.append = this.appendList.join(",");
    }

    if (this.flatFields.length > 0) {
      params.fields = this.flatFields.join(",");
    } else if (Object.keys(this.fieldParams).length > 0) {
      const fieldsObj: Record<string, string> = {};
      for (const scope of Object.keys(this.fieldParams)) {
        fieldsObj[scope] = this.fieldParams[scope]!.join(",");
      }
      params.fields = fieldsObj;
    }

    if (this.options.bracketPagination) {
      const pageObj: Record<string, number> = {};
      if (this.pageParam) pageObj.number = this.pageParam;
      if (this.limitParam) pageObj.size = this.limitParam;
      if (Object.keys(pageObj).length > 0) {
        params.page = pageObj;
      }
    } else {
      if (this.pageParam) params.page = this.pageParam;
      if (this.limitParam) params.limit = this.limitParam;
    }

    if (this.searchParam) {
      params.q = this.searchParam;
    }

    for (const key of Object.keys(this.extraParams)) {
      params[key] = this.extraParams[key];
    }

    return params;
  }

  /**
   * Convert the QueryBuilder state to an encoded URL query string.
   *
   * @param customParams Optional parameters override
   * @returns Encoded query string without leading '?'
   */
  public toQueryString(customParams?: RestQueryParams): string {
    const p = customParams || this.build();
    const parts: string[] = [];

    const encodeList = (str: string) =>
      str
        .split(",")
        .map((s) => encodeURIComponent(s.trim()))
        .join(",");

    if (p.filter && typeof p.filter === "object") {
      for (const field of Object.keys(p.filter)) {
        const val = p.filter[field];
        if (Array.isArray(val)) {
          if (this.options.arrayFormat === "bracket") {
            for (const item of val) {
              parts.push(
                `filter[${encodeURIComponent(field)}][]=${encodeURIComponent(String(item))}`,
              );
            }
          } else {
            parts.push(
              `filter[${encodeURIComponent(field)}]=${val.map((item) => encodeURIComponent(String(item))).join(",")}`,
            );
          }
        } else if (val !== undefined && val !== null) {
          parts.push(
            `filter[${encodeURIComponent(field)}]=${encodeURIComponent(String(val))}`,
          );
        }
      }
    }

    if (typeof p.sort === "string" && p.sort.trim() !== "") {
      parts.push(`sort=${encodeList(p.sort)}`);
    }

    if (typeof p.include === "string" && p.include.trim() !== "") {
      parts.push(`include=${encodeList(p.include)}`);
    }

    if (typeof p.append === "string" && p.append.trim() !== "") {
      parts.push(`append=${encodeList(p.append)}`);
    }

    if (typeof p.fields === "string" && p.fields.trim() !== "") {
      parts.push(`fields=${encodeList(p.fields)}`);
    } else if (p.fields && typeof p.fields === "object") {
      for (const scope of Object.keys(p.fields)) {
        const val = p.fields[scope];
        if (val) {
          parts.push(
            `fields[${encodeURIComponent(scope)}]=${encodeList(String(val))}`,
          );
        }
      }
    }

    if (typeof p.page === "object" && p.page !== null) {
      for (const k of Object.keys(p.page)) {
        parts.push(
          `page[${encodeURIComponent(k)}]=${encodeURIComponent(String((p.page as any)[k]))}`,
        );
      }
    } else if (p.page !== undefined && p.page !== null) {
      parts.push(`page=${encodeURIComponent(String(p.page))}`);
    }

    if (p.limit !== undefined && p.limit !== null) {
      parts.push(`limit=${encodeURIComponent(String(p.limit))}`);
    }

    if (p.q !== undefined && p.q !== null && String(p.q).trim() !== "") {
      parts.push(`q=${encodeURIComponent(String(p.q))}`);
    }

    const knownKeys = new Set([
      "filter",
      "sort",
      "include",
      "fields",
      "append",
      "page",
      "limit",
      "q",
    ]);

    for (const key of Object.keys(p)) {
      if (!knownKeys.has(key)) {
        const val = p[key];
        if (val !== undefined && val !== null) {
          parts.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`,
          );
        }
      }
    }

    return parts.join("&");
  }
}
