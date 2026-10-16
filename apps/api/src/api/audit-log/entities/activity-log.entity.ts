import { AutoIncrementID } from '../../../common/types/common.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('activity_logs')
export class ActivityLogEntity {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_activity_log_id',
    type: 'bigint',
  })
  id!: AutoIncrementID;

  @Index('IDX_activity_logs_log_name')
  @Column({ name: 'log_name', type: 'varchar', default: 'default' })
  logName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Index('IDX_activity_logs_subject_type')
  @Column({ name: 'subject_type', type: 'varchar', nullable: true })
  subjectType?: string | null;

  @Index('IDX_activity_logs_subject_id')
  @Column({ name: 'subject_id', type: 'bigint', nullable: true })
  subjectId?: AutoIncrementID | null;

  @Index('IDX_activity_logs_causer_type')
  @Column({ name: 'causer_type', type: 'varchar', nullable: true })
  causerType?: string | null;

  @Index('IDX_activity_logs_causer_id')
  @Column({ name: 'causer_id', type: 'varchar', nullable: true })
  causerId?: string | null;

  @Column({ type: 'json', nullable: true })
  properties?: Record<string, any> | null;

  @Index('IDX_activity_logs_event')
  @Column({ type: 'varchar', nullable: true })
  event?: string | null;

  @Index('IDX_activity_logs_batch_uuid')
  @Column({ name: 'batch_uuid', type: 'uuid', nullable: true })
  batchUuid?: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  updatedAt!: Date;
}

export { ActivityLogEntity as AuditLogEntity };
