import { DEFAULT_PAGE_LIMIT } from '../constants/app.constant';

export interface QueryBuilderParametersConfig {
  filter: string;
  sort: string;
  include: string;
  page: string;
  limit: string;
  fields: string;
  append: string;
}

export interface QueryBuilderConfig {
  /**
   * Names of the query parameters on the URL.
   * e.g., customize 'limit' to 'per_page', 'filter' to 'filters'.
   */
  parameters: QueryBuilderParametersConfig;

  /**
   * Suffix appended to relation property name when counting.
   * Default: 'Count' -> 'entity.commentsCount'.
   * Alternatively '_count' for snake_case -> 'entity.comments_count'.
   */
  countSuffix: string;

  /**
   * Default number of items per page when not specified in query.
   */
  defaultLimit: number;

  /**
   * Maximum allowed items per page to prevent DoS.
   */
  maxLimit: number;

  /**
   * If true, throws BadRequestException when client passes an unallowed
   * filter, sort, include, or field.
   * If false, silently ignores unallowed parameters.
   */
  strictMode: boolean;
}

export type QueryBuilderUserConfig = Partial<{
  parameters: Partial<QueryBuilderParametersConfig>;
  countSuffix: string;
  defaultLimit: number;
  maxLimit: number;
  strictMode: boolean;
}>;

const DEFAULT_CONFIG: QueryBuilderConfig = {
  parameters: {
    filter: 'filter',
    sort: 'sort',
    include: 'include',
    page: 'page',
    limit: 'limit',
    fields: 'fields',
    append: 'append',
  },
  countSuffix: 'Count',
  defaultLimit: DEFAULT_PAGE_LIMIT ?? 20,
  maxLimit: 100,
  strictMode: false,
};

let currentConfig: QueryBuilderConfig = {
  ...DEFAULT_CONFIG,
  parameters: { ...DEFAULT_CONFIG.parameters },
};

/**
 * Get the current global QueryBuilder configuration.
 */
export function getGlobalConfig(): QueryBuilderConfig {
  return currentConfig;
}

/**
 * Update the global QueryBuilder configuration.
 */
export function setGlobalConfig(
  userConfig: QueryBuilderUserConfig,
): QueryBuilderConfig {
  currentConfig = {
    ...currentConfig,
    ...userConfig,
    parameters: {
      ...currentConfig.parameters,
      ...(userConfig.parameters ?? {}),
    },
  };
  return currentConfig;
}

/**
 * Reset global configuration back to defaults (useful in tests).
 */
export function resetGlobalConfig(): void {
  currentConfig = {
    ...DEFAULT_CONFIG,
    parameters: { ...DEFAULT_CONFIG.parameters },
  };
}
