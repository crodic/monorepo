import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ length: 255 })
  @Index('UQ_users_email', { where: '"deleted_at" IS NULL', unique: true })
  email!: string;

  @Column({ length: 100, nullable: true })
  firstName?: string;

  @Column({ length: 100, nullable: true })
  lastName?: string;

  @Column({ default: true })
  isActive!: boolean;
}
