import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  OffsetPaginatedDto,
  Paginated,
  PaginatedLinks,
  PaginatedMeta,
} from '../dto/offset-pagination/paginated.dto';
import { AllowedFilter, FilterOperator } from './allowed-filter';
import { AllowedInclude } from './allowed-include';
import { AllowedSort } from './allowed-sort';
import { getGlobalConfig } from './config';

export interface ApiQueryBuilderFilterConfig {
  name: string;
  type?: any;
  enum?: any[] | Record<string, any>;
  description?: string;
  example?: any;
  isArray?: boolean;
}

export interface ApiQueryBuilderDocsOptions<T extends Type<any> = any> {
  /**
   * The DTO or Entity class returned in the data array.
   */
  entity: T;

  /**
   * Whitelisted filter definitions or filter names.
   * Can accept plain strings, AllowedFilter instances, or detailed config objects.
   *
   * @example
   * filters: ['name', AllowedFilter.exact('status'), AllowedFilter.trashed()]
   */
  filters?: (string | AllowedFilter<any> | ApiQueryBuilderFilterConfig)[];

  /**
   * Whitelisted sort columns or AllowedSort instances.
   *
   * @example
   * sorts: ['createdAt', 'name', AllowedSort.field('role', 'roles.name')]
   */
  sorts?: (string | AllowedSort<any>)[];

  /**
   * Default sort column (e.g. '-createdAt').
   */
  defaultSort?: string;

  /**
   * Whitelisted relation includes or AllowedInclude instances.
   *
   * @example
   * includes: ['roles', 'profile', AllowedInclude.count('comments')]
   */
  includes?: (string | AllowedInclude<any>)[];

  /**
   * Whitelisted fields (sparse fieldsets).
   *
   * @example
   * fields: ['id', 'name', 'email', 'roles.id', 'roles.title']
   */
  fields?: string[];

  /**
   * Default pagination limit (overrides global default).
   */
  defaultLimit?: number;

  /**
   * Maximum pagination limit (overrides global maxLimit).
   */
  maxLimit?: number;

  /**
   * Description for the 200 OK response.
   */
  description?: string;
}

/**
 * Swagger documentation decorator for Spatie-style QueryBuilder endpoints.
 * Automatically documents:
 * - 200 OK Paginated response schema containing the given entity type
 * - Filter query parameters (`filter[name]`, `filter[status]`, etc.)
 * - Sort query parameter with allowed sort options
 * - Include query parameter with allowed relations
 * - Sparse fieldsets parameter (`fields`)
 * - Pagination parameters (`page`, `limit`) with defaults and bounds
 *
 * @example
 * ```ts
 * @Get()
 * @ApiQueryBuilderDocs({
 *   entity: UserDto,
 *   filters: ['name', AllowedFilter.exact('status'), AllowedFilter.trashed()],
 *   sorts: ['createdAt', 'name'],
 *   defaultSort: '-createdAt',
 *   includes: ['roles', 'profile'],
 *   fields: ['id', 'name', 'email'],
 * })
 * findAll(@Query() query: QueryParams) {
 *   return this.userService.findAll(query);
 * }
 * ```
 */
export function ApiQueryBuilderDocs<T extends Type<any>>(
  options: ApiQueryBuilderDocsOptions<T>,
): MethodDecorator {
  const config = getGlobalConfig();
  const decorators: MethodDecorator[] = [];

  // 1. Extra models and Paginated Response Schema
  decorators.push(
    ApiExtraModels(
      Paginated,
      PaginatedMeta,
      PaginatedLinks,
      OffsetPaginatedDto,
      options.entity,
    ),
    ApiOkResponse({
      description: options.description ?? 'Paginated list of results',
      schema: {
        allOf: [
          { $ref: getSchemaPath(Paginated) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(options.entity) },
              },
            },
          },
        ],
      },
    }),
  );

  // 2. Filters
  const filterKey = config.parameters.filter;
  if (options.filters && options.filters.length > 0) {
    for (const filter of options.filters) {
      if (typeof filter === 'string') {
        decorators.push(
          ApiQuery({
            name: `${filterKey}[${filter}]`,
            required: false,
            type: String,
            description: `Filter by ${filter} (partial or exact match)`,
          }),
        );
      } else if (filter instanceof AllowedFilter) {
        if (filter.operator === FilterOperator.TRASHED) {
          decorators.push(
            ApiQuery({
              name: `${filterKey}[${filter.name}]`,
              required: false,
              enum: ['with', 'only', 'without'],
              description: `Filter soft-deleted records: 'with' (all), 'only' (deleted only), 'without' (active only)`,
            }),
          );
        } else {
          decorators.push(
            ApiQuery({
              name: `${filterKey}[${filter.name}]`,
              required: false,
              type: String,
              description: `Filter by ${filter.name} (operator: ${filter.operator})`,
            }),
          );
        }
      } else if (typeof filter === 'object' && 'name' in filter) {
        decorators.push(
          ApiQuery({
            name: `${filterKey}[${filter.name}]`,
            required: false,
            enum: filter.enum,
            type: filter.type ?? (filter.enum ? undefined : String),
            description: filter.description ?? `Filter by ${filter.name}`,
            example: filter.example,
            isArray: filter.isArray,
          }),
        );
      }
    }
  }

  // 3. Sorts
  const sortKey = config.parameters.sort;
  if (options.sorts && options.sorts.length > 0) {
    const sortNames = options.sorts.map((s) =>
      typeof s === 'string' ? s : s.name,
    );
    decorators.push(
      ApiQuery({
        name: sortKey,
        required: false,
        type: String,
        description: `Sort criteria (comma-separated). Prefix with '-' for descending order. Allowed: [${sortNames.join(', ')}]`,
        example:
          options.defaultSort ??
          (sortNames.length > 0 ? `-${sortNames[0]}` : undefined),
      }),
    );
  }

  // 4. Includes
  const includeKey = config.parameters.include;
  if (options.includes && options.includes.length > 0) {
    const includeNames = options.includes.map((i) =>
      typeof i === 'string' ? i : i.name,
    );
    decorators.push(
      ApiQuery({
        name: includeKey,
        required: false,
        type: String,
        description: `Relations to include (comma-separated). Allowed: [${includeNames.join(', ')}]`,
        example:
          includeNames.length > 0
            ? includeNames.slice(0, 2).join(',')
            : undefined,
      }),
    );
  }

  // 5. Fields (Sparse Fieldsets)
  const fieldsKey = config.parameters.fields;
  if (options.fields && options.fields.length > 0) {
    decorators.push(
      ApiQuery({
        name: fieldsKey,
        required: false,
        type: String,
        description: `Sparse fieldsets: select specific columns (comma-separated or fields[entity]=col1,col2). Allowed: [${options.fields.join(', ')}]`,
        example: options.fields.slice(0, 3).join(','),
      }),
    );
  }

  // 6. Pagination (Page & Limit)
  const pageKey = config.parameters.page;
  const limitKey = config.parameters.limit;
  const defaultLimit = options.defaultLimit ?? config.defaultLimit;
  const maxLimit = options.maxLimit ?? config.maxLimit;

  decorators.push(
    ApiQuery({
      name: pageKey,
      required: false,
      type: Number,
      description: 'Page number (1-based index)',
      example: 1,
      schema: {
        type: 'integer',
        minimum: 1,
        default: 1,
      },
    }),
    ApiQuery({
      name: limitKey,
      required: false,
      type: Number,
      description: `Number of items per page (maximum: ${maxLimit})`,
      example: defaultLimit,
      schema: {
        type: 'integer',
        minimum: 1,
        maximum: maxLimit,
        default: defaultLimit,
      },
    }),
  );

  return applyDecorators(...decorators);
}
