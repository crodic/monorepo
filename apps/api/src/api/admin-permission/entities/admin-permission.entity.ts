import { AutoIncrementID } from '../../../common/types/common.type';
import { AbstractEntity } from '../../../database/entities/abstract.entity';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { AdminRoleEntity } from '../../admin-role/entities/admin-role.entity';

@Entity('admin_permissions')
export class AdminPermissionEntity extends AbstractEntity {
  constructor(data?: Partial<AdminPermissionEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_admin_permission_id',
    type: 'bigint',
  })
  id!: AutoIncrementID;

  @Column()
  name!: string;

  @Column()
  group!: string;

  @Column({ nullable: true })
  description?: string;

  @Index('UQ_admin_permissions_key', { unique: true })
  @Column()
  key!: string;

  @ManyToMany(() => AdminRoleEntity, (role) => role.permissionEntities)
  roles?: Relation<AdminRoleEntity>[];
}
