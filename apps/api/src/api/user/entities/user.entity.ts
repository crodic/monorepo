import { AutoIncrementID } from '../../../common/types/common.type';
import { AbstractEntity } from '../../../database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { UserAccountEntity } from './user-account.entity';
import { UserSessionEntity } from '../../auth/entities/user-session.entity';
import { IAuthUser } from '../../auth/interfaces/auth-entity.interface';

@Entity('users')
export class UserEntity extends AbstractEntity implements IAuthUser {
  @OneToMany(() => UserAccountEntity, (account) => account.user)
  accounts?: Relation<UserAccountEntity>[];

  @OneToMany(() => UserSessionEntity, (session) => session.user)
  sessions?: Relation<UserSessionEntity>[];

  constructor(data?: Partial<UserEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_user_id',
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
  @Index('UQ_user_email', { where: '"deleted_at" IS NULL', unique: true })
  email!: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({
    type: 'jsonb',
    default: () => `'{"email": true, "system": true, "security": true}'`,
  })
  notifications!: Record<string, boolean>;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt?: Date | null;

  @Column({ type: 'timestamptz', name: 'verified_at', nullable: true })
  verifiedAt?: Date | null;
}
