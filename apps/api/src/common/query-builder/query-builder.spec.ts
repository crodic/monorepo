import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryBuilder } from './query-builder';
import { AllowedFilter, FilterOperator } from './allowed-filter';
import { AllowedSort } from './allowed-sort';
import { AllowedInclude } from './allowed-include';
import { resetGlobalConfig, setGlobalConfig } from './config';
import {
  InvalidFieldQueryException,
  InvalidFilterQueryException,
  InvalidIncludeQueryException,
  InvalidSortQueryException,
} from './exceptions';
import { FilterInterface, SortInterface, IncludeInterface } from './types';

interface TestUser extends ObjectLiteral {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
  deletedAt?: Date;
  roles?: any[];
}

function createMockQb(alias = 'user') {
  const qb: any = {
    alias,
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getOne: jest.fn().mockResolvedValue(null),
  };
  return qb as unknown as SelectQueryBuilder<TestUser>;
}

function createMockRepo(
  qb: SelectQueryBuilder<TestUser>,
  targetName = 'UserEntity',
) {
  return {
    target: class UserEntity {},
    metadata: { targetName },
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  } as unknown as Repository<TestUser>;
}

describe('Spatie-style QueryBuilder', () => {
  afterEach(() => {
    resetGlobalConfig();
  });

  describe('Initialization (QueryBuilder.for)', () => {
    it('should initialize from an existing SelectQueryBuilder', () => {
      const qb = createMockQb('customUser');
      const builder = QueryBuilder.for(qb, {});

      expect(builder).toBeInstanceOf(QueryBuilder);
      expect(builder.getQueryBuilder()).toBe(qb);
    });

    it('should initialize from a Repository and infer the alias from targetName', () => {
      const qb = createMockQb('user');
      const repo = createMockRepo(qb, 'UserEntity');

      const builder = QueryBuilder.for(repo, {});

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('should handle multi-word target names correctly', () => {
      const qb = createMockQb('adminUser');
      const repo = createMockRepo(qb, 'AdminUserEntity');

      QueryBuilder.for(repo, {});

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('adminUser');
    });
  });

  describe('AllowedFilter Operators', () => {
    it('should apply partial filter by default when provided as string', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { name: 'alice' } })
        .allowedFilters(['name'])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith('user.name ILIKE :qb_f_name_0', {
        qb_f_name_0: '%alice%',
      });
    });

    it('should apply partial filter with array values using OR', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { name: ['alice', 'bob'] } })
        .allowedFilters(['name'])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(user.name ILIKE :qb_f_name_0_0 OR user.name ILIKE :qb_f_name_0_1)',
        {
          qb_f_name_0_0: '%alice%',
          qb_f_name_0_1: '%bob%',
        },
      );
    });

    it('should apply exact filter with single value', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { status: 'active' } })
        .allowedFilters([AllowedFilter.exact('status')])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith('user.status = :qb_f_status_0', {
        qb_f_status_0: 'active',
      });
    });

    it('should apply exact filter with array values using IN', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { status: ['active', 'pending'] } })
        .allowedFilters([AllowedFilter.exact('status')])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith(
        'user.status IN (:...qb_f_status_0)',
        { qb_f_status_0: ['active', 'pending'] },
      );
    });

    it('should apply startsWith filter (prefix match)', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { code: 'INV' } })
        .allowedFilters([AllowedFilter.startsWith('code')])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith('user.code ILIKE :qb_f_code_0', {
        qb_f_code_0: 'INV%',
      });
    });

    it('should apply endsWith filter (suffix match)', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { email: '.com' } })
        .allowedFilters([AllowedFilter.endsWith('email')])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith(
        'user.email ILIKE :qb_f_email_0',
        { qb_f_email_0: '%.com' },
      );
    });

    it('should apply comparison operator filter', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { minAge: 18 } })
        .allowedFilters([AllowedFilter.operator('minAge', '>=', 'age')])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith('user.age >= :qb_f_age_0', {
        qb_f_age_0: 18,
      });
    });

    it('should handle relation column with dot notation in filters', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { role: 'admin' } })
        .allowedFilters([AllowedFilter.exact('role', 'roles.name')])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith(
        'roles.name = :qb_f_roles_name_0',
        { qb_f_roles_name_0: 'admin' },
      );
    });

    it('should apply trashed filter for soft deletes', () => {
      const qbWith = createMockQb();
      QueryBuilder.for(qbWith, { filter: { trashed: 'with' } })
        .allowedFilters([AllowedFilter.trashed()])
        .getQueryBuilder();

      expect(qbWith.withDeleted).toHaveBeenCalled();

      const qbOnly = createMockQb();
      QueryBuilder.for(qbOnly, { filter: { trashed: 'only' } })
        .allowedFilters([AllowedFilter.trashed()])
        .getQueryBuilder();

      expect(qbOnly.withDeleted).toHaveBeenCalled();
      expect(qbOnly.andWhere).toHaveBeenCalledWith(
        'user.deletedAt IS NOT NULL',
      );
    });

    it('should apply custom scope filter callback', () => {
      const qb = createMockQb();
      const scopeFn = jest.fn((builder, value, alias) => {
        builder.andWhere(
          `(${alias}.name ILIKE :s OR ${alias}.email ILIKE :s)`,
          {
            s: `%${value}%`,
          },
        );
      });

      QueryBuilder.for(qb, { filter: { search: 'keyword' } })
        .allowedFilters([AllowedFilter.scope('search', scopeFn)])
        .getQueryBuilder();

      expect(scopeFn).toHaveBeenCalledWith(qb, 'keyword', 'user');
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(user.name ILIKE :s OR user.email ILIKE :s)',
        { s: '%keyword%' },
      );
    });

    it('should apply AllowedFilter.custom with a closure and a FilterInterface class', () => {
      const qb = createMockQb();
      const closureFn = jest.fn((builder, value, alias) => {
        builder.andWhere(`${alias}.customField = :val`, { val: value });
      });

      class MyFilter implements FilterInterface {
        apply(builder: SelectQueryBuilder<any>, value: any, alias: string) {
          builder.andWhere(`${alias}.classField = :cVal`, { cVal: value });
        }
      }

      QueryBuilder.for(qb, {
        filter: { customKey: 'foo', classKey: 'bar' },
      })
        .allowedFilters([
          AllowedFilter.custom('customKey', closureFn),
          AllowedFilter.custom('classKey', new MyFilter()),
        ])
        .getQueryBuilder();

      expect(closureFn).toHaveBeenCalledWith(qb, 'foo', 'user');
      expect(qb.andWhere).toHaveBeenCalledWith('user.customField = :val', {
        val: 'foo',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('user.classField = :cVal', {
        cVal: 'bar',
      });
    });

    it('should ignore filters not present in allowedFilters when strict mode is false', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { unallowed: 'malicious', name: 'safe' } })
        .allowedFilters(['name'])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith('user.name ILIKE :qb_f_name_0', {
        qb_f_name_0: '%safe%',
      });
    });

    it('should throw InvalidFilterQueryException in strict mode for unallowed filters', () => {
      const qb = createMockQb();
      const builder = QueryBuilder.for(qb, {
        filter: { unallowed: 'malicious', name: 'safe' },
      })
        .allowedFilters(['name'])
        .strict(true);

      expect(() => builder.getQueryBuilder()).toThrow(
        InvalidFilterQueryException,
      );
    });

    it('should skip filter if value is empty string, null, or undefined', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, {
        filter: { name: '', status: null as any, email: undefined as any },
      })
        .allowedFilters(['name', AllowedFilter.exact('status'), 'email'])
        .getQueryBuilder();

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('should expose FilterOperator enum values', () => {
      expect(FilterOperator.EXACT).toBe('exact');
      expect(FilterOperator.PARTIAL).toBe('partial');
      expect(FilterOperator.STARTS_WITH).toBe('starts_with');
      expect(FilterOperator.ENDS_WITH).toBe('ends_with');
      expect(FilterOperator.OPERATOR).toBe('operator');
      expect(FilterOperator.SCOPE).toBe('scope');
      expect(FilterOperator.TRASHED).toBe('trashed');
    });
  });

  describe('AllowedSort', () => {
    it('should apply ascending sort when name does not start with -', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { sort: 'name' })
        .allowedSorts(['name'])
        .getQueryBuilder();

      expect(qb.orderBy).toHaveBeenCalledWith('user.name', 'ASC');
    });

    it('should apply descending sort when name starts with -', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { sort: '-createdAt' })
        .allowedSorts(['createdAt'])
        .getQueryBuilder();

      expect(qb.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
    });

    it('should apply multiple sorts in order (orderBy then addOrderBy)', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { sort: '-createdAt,name' })
        .allowedSorts(['createdAt', 'name'])
        .getQueryBuilder();

      expect(qb.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
      expect(qb.addOrderBy).toHaveBeenCalledWith('user.name', 'ASC');
    });

    it('should support relation column in sort with dot notation', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { sort: '-roleName' })
        .allowedSorts([AllowedSort.field('roleName', 'roles.name')])
        .getQueryBuilder();

      expect(qb.orderBy).toHaveBeenCalledWith('roles.name', 'DESC');
    });

    it('should fall back to defaultSort when sort param is not provided', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, {})
        .allowedSorts(['name', 'createdAt'])
        .defaultSort('-createdAt,name')
        .getQueryBuilder();

      expect(qb.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
      expect(qb.addOrderBy).toHaveBeenCalledWith('user.name', 'ASC');
    });

    it('should apply AllowedSort.custom with a closure and a SortInterface class', () => {
      const qb = createMockQb();
      const sortFn = jest.fn((builder, direction, alias) => {
        builder.addOrderBy(`${alias}.score`, direction);
      });

      class CustomPopularitySort implements SortInterface {
        apply(
          builder: SelectQueryBuilder<any>,
          direction: 'ASC' | 'DESC',
          alias: string,
        ) {
          builder.addOrderBy(`${alias}.views + ${alias}.likes`, direction);
        }
      }

      QueryBuilder.for(qb, { sort: '-score,popularity' })
        .allowedSorts([
          AllowedSort.custom('score', sortFn),
          AllowedSort.custom('popularity', new CustomPopularitySort()),
        ])
        .getQueryBuilder();

      expect(sortFn).toHaveBeenCalledWith(qb, 'DESC', 'user');
      expect(qb.addOrderBy).toHaveBeenCalledWith(
        'user.views + user.likes',
        'ASC',
      );
    });

    it('should throw InvalidSortQueryException in strict mode for unallowed sorts', () => {
      const qb = createMockQb();
      const builder = QueryBuilder.for(qb, { sort: 'unallowedSort' })
        .allowedSorts(['name'])
        .strict(true);

      expect(() => builder.getQueryBuilder()).toThrow(
        InvalidSortQueryException,
      );
    });
  });

  describe('AllowedInclude', () => {
    it('should apply relationship include with leftJoinAndSelect', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { include: 'roles' })
        .allowedIncludes(['roles'])
        .getQueryBuilder();

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.roles', 'roles');
    });

    it('should handle nested relation includes (dot notation)', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { include: 'posts.comments' })
        .allowedIncludes(['posts.comments'])
        .getQueryBuilder();

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.posts', 'posts');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'posts.comments',
        'posts_comments',
      );
    });

    it('should support count include with custom countSuffix', () => {
      setGlobalConfig({ countSuffix: '_count' });
      const qb = createMockQb();
      QueryBuilder.for(qb, { include: 'comments' })
        .allowedIncludes([AllowedInclude.count('comments')])
        .getQueryBuilder();

      expect(qb.loadRelationCountAndMap).toHaveBeenCalledWith(
        'user.comments_count',
        'user.comments',
      );
    });

    it('should apply AllowedInclude.custom with a closure and an IncludeInterface class', () => {
      const qb = createMockQb();
      const includeFn = jest.fn((builder, alias) => {
        builder.leftJoinAndSelect(`${alias}.customRel`, 'customRel');
      });

      class ActiveRolesInclude implements IncludeInterface {
        apply(builder: SelectQueryBuilder<any>, alias: string) {
          builder.leftJoinAndSelect(
            `${alias}.activeRoles`,
            'activeRoles',
            'activeRoles.isActive = true',
          );
        }
      }

      QueryBuilder.for(qb, { include: 'customRel,activeRoles' })
        .allowedIncludes([
          AllowedInclude.custom('customRel', includeFn),
          AllowedInclude.custom('activeRoles', new ActiveRolesInclude()),
        ])
        .getQueryBuilder();

      expect(includeFn).toHaveBeenCalledWith(qb, 'user');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.activeRoles',
        'activeRoles',
        'activeRoles.isActive = true',
      );
    });

    it('should throw InvalidIncludeQueryException in strict mode for unallowed includes', () => {
      const qb = createMockQb();
      const builder = QueryBuilder.for(qb, { include: 'unknownRelation' })
        .allowedIncludes(['roles'])
        .strict(true);

      expect(() => builder.getQueryBuilder()).toThrow(
        InvalidIncludeQueryException,
      );
    });
  });

  describe('Sparse Fieldsets (allowedFields)', () => {
    it('should select flat fields on root entity', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { fields: 'id,name' })
        .allowedFields(['id', 'name', 'email'])
        .getQueryBuilder();

      expect(qb.select).toHaveBeenCalledWith(['user.id', 'user.name']);
    });

    it('should select scoped fields for root and relations', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, {
        fields: {
          user: 'id,name',
          roles: 'id,title',
        },
      })
        .allowedFields(['id', 'name', 'roles.id', 'roles.title'])
        .getQueryBuilder();

      expect(qb.select).toHaveBeenCalledWith(['user.id', 'user.name']);
      expect(qb.addSelect).toHaveBeenCalledWith(['roles.id', 'roles.title']);
    });

    it('should throw InvalidFieldQueryException in strict mode for unallowed fields', () => {
      const qb = createMockQb();
      const builder = QueryBuilder.for(qb, { fields: 'id,secretHash' })
        .allowedFields(['id', 'name'])
        .strict(true);

      expect(() => builder.getQueryBuilder()).toThrow(
        InvalidFieldQueryException,
      );
    });
  });

  describe('Configuration & Parameter Customization', () => {
    it('should support customized parameter names', () => {
      QueryBuilder.configure({
        parameters: {
          filter: 'filters',
          sort: 'order',
          limit: 'per_page',
          page: 'p',
        },
      });

      const qb = createMockQb();
      QueryBuilder.for(qb, {
        filters: { name: 'alice' },
        order: '-createdAt',
        per_page: 25,
        p: 2,
      })
        .allowedFilters(['name'])
        .allowedSorts(['createdAt'])
        .paginate();

      expect(qb.andWhere).toHaveBeenCalledWith('user.name ILIKE :qb_f_name_0', {
        qb_f_name_0: '%alice%',
      });
      expect(qb.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
      expect(qb.take).toHaveBeenCalledWith(25);
      expect(qb.skip).toHaveBeenCalledWith(25); // (2 - 1) * 25
    });
  });

  describe('where()', () => {
    it('should append custom WHERE conditions directly', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, {})
        .where('user.tenantId = :tenantId', { tenantId: '123' })
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith('user.tenantId = :tenantId', {
        tenantId: '123',
      });
    });
  });

  describe('Pagination & Limit Resolution', () => {
    it('should paginate with default limit and page', async () => {
      const mockUsers = [{ id: '1', name: 'Alice' }];
      const qb = createMockQb();
      (qb.getManyAndCount as jest.Mock).mockResolvedValue([mockUsers, 1]);

      const result = await QueryBuilder.for(qb, {}).paginate();

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10); // DEFAULT_PAGE_LIMIT
      expect(result.data).toEqual(mockUsers);

      // nestjs-paginate standard meta
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.itemsPerPage).toBe(10);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.sortBy).toEqual([]);

      // nestjs-paginate standard links
      expect(result.links.current).toBe('?page=1&limit=10');
      expect(result.links.first).toBeUndefined();
      expect(result.links.previous).toBeUndefined();
      expect(result.links.next).toBeUndefined();
      expect(result.links.last).toBeUndefined();

      // backwards-compatible pagination getter
      expect(result.pagination.totalRecords).toBe(1);
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should respect page and limit from query parameters and generate multi-page links', async () => {
      const qb = createMockQb();
      (qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 50]);

      const result = await QueryBuilder.for(qb, {
        page: 2,
        limit: 10,
        sort: '-createdAt,name',
        filter: { status: 'active' },
      }).paginate({ path: '/api/v1/users' });

      expect(qb.skip).toHaveBeenCalledWith(10); // (2 - 1) * 10
      expect(qb.take).toHaveBeenCalledWith(10);

      expect(result.meta.totalItems).toBe(50);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.itemsPerPage).toBe(10);
      expect(result.meta.sortBy).toEqual([
        ['createdAt', 'DESC'],
        ['name', 'ASC'],
      ]);
      expect(result.meta.filter).toEqual({ status: 'active' });

      // Links navigation
      expect(result.links.first).toBe(
        '/api/v1/users?page=1&limit=10&sort=-createdAt,name&filter[status]=active',
      );
      expect(result.links.previous).toBe(
        '/api/v1/users?page=1&limit=10&sort=-createdAt,name&filter[status]=active',
      );
      expect(result.links.current).toBe(
        '/api/v1/users?page=2&limit=10&sort=-createdAt,name&filter[status]=active',
      );
      expect(result.links.next).toBe(
        '/api/v1/users?page=3&limit=10&sort=-createdAt,name&filter[status]=active',
      );
      expect(result.links.last).toBe(
        '/api/v1/users?page=5&limit=10&sort=-createdAt,name&filter[status]=active',
      );
    });

    it('should clamp limit to maxLimit', async () => {
      const qb = createMockQb();
      await QueryBuilder.for(qb, { limit: 500 }).setLimit(10, 50).paginate();

      expect(qb.take).toHaveBeenCalledWith(50);
    });
  });

  describe('Terminal Execution Methods', () => {
    it('getMany should build and call qb.getMany', async () => {
      const qb = createMockQb();
      const mockList = [{ id: '1', name: 'Alice' }];
      (qb.getMany as jest.Mock).mockResolvedValue(mockList);

      const result = await QueryBuilder.for(qb, { filter: { name: 'alice' } })
        .allowedFilters(['name'])
        .getMany();

      expect(qb.andWhere).toHaveBeenCalled();
      expect(qb.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockList);
    });

    it('getManyAndCount should build and call qb.getManyAndCount', async () => {
      const qb = createMockQb();
      (qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const result = await QueryBuilder.for(qb, {}).getManyAndCount();

      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual([[], 0]);
    });

    it('getOne should build and call qb.getOne', async () => {
      const qb = createMockQb();
      const user = { id: '1', name: 'Bob' };
      (qb.getOne as jest.Mock).mockResolvedValue(user);

      const result = await QueryBuilder.for(qb, {}).getOne();

      expect(qb.getOne).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('build should be idempotent (not re-apply filters when called multiple times)', async () => {
      const qb = createMockQb();
      const builder = QueryBuilder.for(qb, {
        filter: { name: 'alice' },
      }).allowedFilters(['name']);

      builder.getQueryBuilder();
      builder.getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
    });
  });
});
