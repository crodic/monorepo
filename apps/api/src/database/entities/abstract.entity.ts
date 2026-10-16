import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import {
  BaseEntity,
  CreateDateColumn,
  DataSource,
  UpdateDateColumn,
} from 'typeorm';
import { getOrder, Order } from '../decorators/order.decorator';

export abstract class AbstractEntity extends BaseEntity {
  @Order(9999)
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @Order(9999)
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;

  toDto<Dto>(dtoClass: new () => Dto, options?: ClassTransformOptions): Dto {
    return plainToInstance(dtoClass, this, options);
  }

  static useDataSource(dataSource: DataSource): void {
    BaseEntity.useDataSource.call(this, dataSource);
    const meta = dataSource.entityMetadatasMap.get(this);
    if (meta != null) {
      // Reorder columns based on @Order decorator so audit timestamps appear at the end
      meta.columns = [...meta.columns].sort((x, y) => {
        const orderX = getOrder((x.target as any)?.prototype, x.propertyName);
        const orderY = getOrder((y.target as any)?.prototype, y.propertyName);
        return orderX - orderY;
      });
    }
  }
}
