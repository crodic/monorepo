import 'reflect-metadata';
import { DataSource, EntityMetadata, ColumnMetadata } from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { Order } from '../decorators/order.decorator';

class SampleDto {
  id: number;
  title: string;
  createdAt: Date;
}

class SampleEntity extends AbstractEntity {
  @Order(1)
  id: number;

  @Order(2)
  title: string;
}

describe('AbstractEntity', () => {
  describe('toDto', () => {
    it('should transform entity instance to DTO instance', () => {
      const entity = new SampleEntity();
      entity.id = 1;
      entity.title = 'Test Title';
      entity.createdAt = new Date('2026-01-01T00:00:00Z');
      entity.updatedAt = new Date('2026-01-01T00:00:00Z');

      const dto = entity.toDto(SampleDto);

      expect(dto).toBeInstanceOf(SampleDto);
      expect(dto.id).toBe(1);
      expect(dto.title).toBe('Test Title');
      expect(dto.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
    });
  });

  describe('useDataSource', () => {
    it('should reorder entity columns based on Order decorator', () => {
      const columns = [
        {
          target: SampleEntity,
          propertyName: 'updatedAt',
        },
        {
          target: SampleEntity,
          propertyName: 'title',
        },
        {
          target: SampleEntity,
          propertyName: 'id',
        },
        {
          target: SampleEntity,
          propertyName: 'createdAt',
        },
      ] as unknown as ColumnMetadata[];

      const meta = {
        columns,
      } as unknown as EntityMetadata;

      const entityMetadatasMap = new Map<any, EntityMetadata>();
      entityMetadatasMap.set(SampleEntity, meta);

      const mockDataSource = {
        entityMetadatasMap,
      } as unknown as DataSource;

      SampleEntity.useDataSource(mockDataSource);

      expect(meta.columns.map((c) => c.propertyName)).toEqual([
        'id', // order 1
        'title', // order 2
        'updatedAt', // order 9999
        'createdAt', // order 9999
      ]);
    });

    it('should gracefully handle if entity is not found in entityMetadatasMap', () => {
      const mockDataSource = {
        entityMetadatasMap: new Map(),
      } as unknown as DataSource;

      expect(() => {
        SampleEntity.useDataSource(mockDataSource);
      }).not.toThrow();
    });
  });
});
