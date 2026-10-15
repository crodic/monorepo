import { AutoIncrementID } from '../../../common/types/common.type';
import { AbstractEntity } from '../../../database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { AdminRoleEntity } from '../../admin-role/entities/admin-role.entity';
import { AdminAccountEntity } from './admin-account.entity';
import { AdminSessionEntity } from '../../auth/entities/admin-session.entity';
import { IAuthUser } from '../../auth/interfaces/auth-entity.interface';

@Entity('admin_users')
export class AdminUserEntity extends AbstractEntity implements IAuthUser {
  @OneToMany(() => AdminAccountEntity, (account) => account.admin)
  accounts?: Relation<AdminAccountEntity>[];

  @OneToMany(() => AdminSessionEntity, (session) => session.admin)
  sessions?: Relation<AdminSessionEntity>[];

  constructor(data?: Partial<AdminUserEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_admin_user_id',
    type: 'bigint',
  })
  id!: AutoIncrementID;

  @Column({ length: 100, name: 'first_name', nullable: false })
  firstName!: string;

  @Column({ length: 100, name: 'last_name', nullable: true })
  lastName?: string;

  @Column({
    generatedType: 'STORED',
    asExpression: `first_name || ' ' || last_name`,
    name: 'full_name',
    length: 201,
  })
  fullName!: string;

  @Column()
  @Index('UQ_admin_user_email', { where: '"deleted_at" IS NULL', unique: true })
  email!: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'date', nullable: true })
  birthday?: Date;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({
    type: 'jsonb',
    default: () => `'{"email": true, "system": true, "security": true}'`,
  })
  notifications!: Record<string, boolean>;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled!: boolean;

  @Column({ name: 'two_factor_secret', type: 'varchar', nullable: true })
  twoFactorSecret?: string | null;

  @Column({ name: 'two_factor_backup_codes', type: 'jsonb', nullable: true })
  twoFactorBackupCodes?: string[] | null;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt?: Date | null;

  @ManyToMany(() => AdminRoleEntity, (role) => role.admins, { eager: true })
  @JoinTable({
    name: 'admin_user_role',
    synchronize: false,
    joinColumn: {
      name: 'admin_user_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_admin_user_role_admin_user',
    },
    inverseJoinColumn: {
      name: 'admin_role_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_admin_user_role_admin_role',
    },
  })
  roles!: Relation<AdminRoleEntity>[];

  @Column({ type: 'timestamptz', name: 'verified_at', nullable: true })
  verifiedAt?: Date;
}
