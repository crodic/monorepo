import { QueryFilter } from '../common/interfaces/filter.interface';
import { QuerySort } from '../common/interfaces/sort.interface';
import { applyFilters } from './apply-filter.filter';
import { applySort, applySorts } from './apply-sort.sort';
import { buildPaginator, Order } from './cursor.pagination';
import { paginate } from './offset.pagination';
import { PageOptionsDto } from '../common/dto/offset-pagination/page-options.dto';
import { SelectQueryBuilder } from 'typeorm';

class DummyEntity {
  id!: string;
  name!: string;
  createdAt!: Date;
}

describe('Pagination and Query Utilities', () => {
  describe('applyFilters', () => {
    it('should apply matching filters', () => {
      const qb = {
        andWhere: jest.fn(),
      } as unknown as SelectQueryBuilder<DummyEntity>;

      const filters: QueryFilter<DummyEntity>[] = [
        {
          key: 'name',
          apply: (builder, value) =>
            builder.andWhere('dummy.name = :name', { name: value }),
        },
      ];

      applyFilters(qb, { name: 'Alice', unknown: 'ignore' }, filters);

      expect(qb.andWhere).toHaveBeenCalledWith('dummy.name = :name', {
        name: 'Alice',
      });
    });
  });

  describe('applySort and applySorts', () => {
    it('should apply sorting from sort string', () => {
      const qb = {
        orderBy: jest.fn(),
      } as unknown as SelectQueryBuilder<DummyEntity>;

      const sorts: QuerySort<DummyEntity>[] = [
        {
          key: 'name',
          apply: (builder, direction) =>
            builder.orderBy(
              'dummy.name',
              direction.toUpperCase() as 'ASC' | 'DESC',
            ),
        },
      ];

      applySort(qb, 'name:desc', sorts);

      expect(qb.orderBy).toHaveBeenCalledWith('dummy.name', 'DESC');
    });

    it('should fall back to defaultSort in applySorts when sort string is empty', () => {
      const qb = {
        orderBy: jest.fn(),
      } as unknown as SelectQueryBuilder<DummyEntity>;

      const sorts: QuerySort<DummyEntity>[] = [
        {
          key: 'createdAt',
          apply: (builder, direction) =>
            builder.orderBy(
              'dummy.createdAt',
              direction.toUpperCase() as 'ASC' | 'DESC',
            ),
        },
      ];

      applySorts(qb, '', sorts, { key: 'createdAt', direction: 'desc' });

      expect(qb.orderBy).toHaveBeenCalledWith('dummy.createdAt', 'DESC');
    });
  });

  describe('paginate (offset)', () => {
    it('should execute pagination and return entities with meta', async () => {
      const mockEntities = [
        { id: '1', name: 'Entity 1', createdAt: new Date() },
      ];
      const qb = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockEntities),
        getCount: jest.fn().mockResolvedValue(1),
      } as unknown as SelectQueryBuilder<DummyEntity>;

      const pageOptions = new PageOptionsDto();
      const [entities, meta] = await paginate(qb, pageOptions);

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(entities).toEqual(mockEntities);
      expect(meta.totalRecords).toBe(1);
      expect(meta.currentPage).toBe(1);
    });
  });

  describe('buildPaginator (cursor)', () => {
    it('should initialize paginator instance with options', () => {
      const paginator = buildPaginator({
        entity: DummyEntity,
        query: {
          limit: 25,
          order: Order.ASC,
          afterCursor: 'cursor_123',
        },
      });

      expect(paginator).toBeDefined();
    });
  });
});
