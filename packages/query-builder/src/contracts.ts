/**
 * Shared Monorepo Query Contracts
 * Standardizes API query capabilities (allowed sorts, filters, includes)
 * and pagination response payloads between NestJS backend and web clients.
 */

export interface PaginationMeta {
  currentPage: number;
  itemCount?: number;
  itemsPerPage?: number;
  totalItems?: number;
  totalPages: number;
  sortBy?: [string, "ASC" | "DESC"][];
  searchBy?: string[];
  search?: string;
  filter?: Record<string, string | string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first?: string;
    previous?: string;
    current?: string;
    next?: string;
    last?: string;
  };
}

/**
 * Filter configuration contract for a resource.
 */
export interface ResourceFilterConfig<T = any> {
  name: keyof T | string;
  operator?:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "btw"
    | "in"
    | "notIn"
    | "ilike"
    | "null"
    | "notNull";
  description?: string;
}

/**
 * Defines the contract of a queryable resource across backend and frontend.
 */
export interface ResourceQueryContract<TEntity = any> {
  /**
   * Fields that can be used for sorting (e.g. ['name', 'createdAt', 'roles.name'])
   */
  allowedSorts: readonly (keyof TEntity | string)[];

  /**
   * Fields that can be filtered on
   */
  allowedFilters?: readonly (
    keyof TEntity | string | ResourceFilterConfig<TEntity>
  )[];

  /**
   * Relations that can be eager loaded
   */
  allowedIncludes?: readonly string[];

  /**
   * Default sort expression (e.g. '-createdAt' or 'createdAt:DESC')
   */
  defaultSort?: string;

  /**
   * Default page limit
   */
  defaultLimit?: number;

  /**
   * Maximum page limit enforced by backend
   */
  maxLimit?: number;
}

/**
 * Helper to define a type-safe query contract for an entity.
 */
export function defineQueryContract<TEntity>(
  contract: ResourceQueryContract<TEntity>,
): ResourceQueryContract<TEntity> {
  return Object.freeze(contract);
}

/**
 * Checks whether a given field is allowed to be sorted under this contract.
 */
export function isAllowedSort<TEntity>(
  contract: ResourceQueryContract<TEntity>,
  field: string,
): boolean {
  const cleanField = field.replace(/^[-+]/, "").split(":")[0] || "";
  return (contract.allowedSorts as readonly string[]).includes(cleanField);
}

/**
 * Checks whether a given field is allowed to be filtered under this contract.
 */
export function isAllowedFilter<TEntity>(
  contract: ResourceQueryContract<TEntity>,
  field: string,
): boolean {
  if (!contract.allowedFilters) return false;
  return contract.allowedFilters.some((f) => {
    if (typeof f === "object" && f !== null && "name" in f) {
      return String(f.name) === field;
    }
    return String(f) === field;
  });
}
