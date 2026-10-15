import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryBuilder } from './query-builder';
import { AllowedFilter, FilterOperator } from './allowed-filter';
import { AllowedSort } from './allowed-sort';
import { AllowedInclude } from './allowed-include';

interface TestUser extends ObjectLiteral {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
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

  describe('AllowedFilter', () => {
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

    it('should support custom column mapping for exact and partial filters', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { role: 'admin', q: 'searchTerm' } })
        .allowedFilters([
          AllowedFilter.exact('role', 'roleId'),
          AllowedFilter.partial('q', 'displayName'),
        ])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledWith('user.roleId = :qb_f_roleId_0', {
        qb_f_roleId_0: 'admin',
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'user.displayName ILIKE :qb_f_displayName_1',
        { qb_f_displayName_1: '%searchTerm%' },
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

    it('should ignore filters not present in allowedFilters', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { filter: { unallowed: 'malicious', name: 'safe' } })
        .allowedFilters(['name'])
        .getQueryBuilder();

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith('user.name ILIKE :qb_f_name_0', {
        qb_f_name_0: '%safe%',
      });
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
      expect(FilterOperator.SCOPE).toBe('scope');
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

    it('should support custom column mapping for field sort', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { sort: '-date' })
        .allowedSorts([AllowedSort.field('date', 'created_at')])
        .getQueryBuilder();

      expect(qb.orderBy).toHaveBeenCalledWith('user.created_at', 'DESC');
    });

    it('should support custom sort callback', () => {
      const qb = createMockQb();
      const sortCallback = jest.fn((builder, dir, alias) => {
        builder.orderBy(`${alias}.viewCount + ${alias}.likeCount`, dir);
      });

      QueryBuilder.for(qb, { sort: '-score' })
        .allowedSorts([AllowedSort.callback('score', sortCallback)])
        .getQueryBuilder();

      expect(sortCallback).toHaveBeenCalledWith(qb, 'DESC', 'user');
      expect(qb.orderBy).toHaveBeenCalledWith(
        'user.viewCount + user.likeCount',
        'DESC',
      );
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

    it('should fall back to defaultSort when provided sort has only unallowed items', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { sort: 'maliciousColumn' })
        .allowedSorts(['name', 'createdAt'])
        .defaultSort('-createdAt')
        .getQueryBuilder();

      expect(qb.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
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

    it('should apply multiple includes comma-separated', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { include: 'roles,profile' })
        .allowedIncludes(['roles', 'profile'])
        .getQueryBuilder();

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.roles', 'roles');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.profile',
        'profile',
      );
    });

    it('should support relation property mapping', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { include: 'author' })
        .allowedIncludes([
          AllowedInclude.relationship('author', 'createdByUser'),
        ])
        .getQueryBuilder();

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.createdByUser',
        'createdByUser',
      );
    });

    it('should support count include via loadRelationCountAndMap', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { include: 'comments' })
        .allowedIncludes([AllowedInclude.count('comments')])
        .getQueryBuilder();

      expect(qb.loadRelationCountAndMap).toHaveBeenCalledWith(
        'user.commentsCount',
        'user.comments',
      );
    });

    it('should support custom callback include', () => {
      const qb = createMockQb();
      const customFn = jest.fn((builder, alias) => {
        builder.leftJoinAndSelect(
          `${alias}.roles`,
          'role',
          'role.isActive = true',
        );
      });

      QueryBuilder.for(qb, { include: 'activeRoles' })
        .allowedIncludes([AllowedInclude.callback('activeRoles', customFn)])
        .getQueryBuilder();

      expect(customFn).toHaveBeenCalledWith(qb, 'user');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.roles',
        'role',
        'role.isActive = true',
      );
    });

    it('should ignore unallowed includes', () => {
      const qb = createMockQb();
      QueryBuilder.for(qb, { include: 'secrets,roles' })
        .allowedIncludes(['roles'])
        .getQueryBuilder();

      expect(qb.leftJoinAndSelect).toHaveBeenCalledTimes(1);
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.roles', 'roles');
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
      expect(result.pagination.totalRecords).toBe(1);
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should respect page and limit from query parameters', async () => {
      const qb = createMockQb();
      await QueryBuilder.for(qb, { page: 3, limit: 15 }).paginate();

      expect(qb.skip).toHaveBeenCalledWith(30); // (3 - 1) * 15
      expect(qb.take).toHaveBeenCalledWith(15);
    });

    it('should clamp limit to maxLimit', async () => {
      const qb = createMockQb();
      await QueryBuilder.for(qb, { limit: 500 }).setLimit(10, 50).paginate();

      expect(qb.take).toHaveBeenCalledWith(50);
    });

    it('should allow overrideDefault in paginate() call', async () => {
      const qb = createMockQb();
      await QueryBuilder.for(qb, {}).paginate(25);

      expect(qb.take).toHaveBeenCalledWith(25);
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
