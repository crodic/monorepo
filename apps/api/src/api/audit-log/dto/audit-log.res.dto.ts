import {
  ClassField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators';
import { Exclude, Expose, Transform } from 'class-transformer';

export interface AuditLogChangeItem {
  field: string;
  label: string;
  from: any;
  to: any;
}

@Exclude()
export class AuditLogResDto {
  @StringField()
  @Expose()
  id!: string;

  @StringField()
  @Expose()
  logName!: string;

  @StringFieldOptional()
  @Expose()
  description?: string;

  @StringFieldOptional()
  @Expose()
  subjectType?: string;

  @StringFieldOptional()
  @Expose()
  subjectId?: string;

  @StringFieldOptional()
  @Expose()
  causerType?: string;

  @StringFieldOptional()
  @Expose()
  causerId?: string;

  @StringFieldOptional()
  @Expose()
  event?: string;

  @StringFieldOptional()
  @Expose()
  batchUuid?: string;

  @Expose()
  properties?: Record<string, any>;

  @ClassField(() => Date)
  @Expose()
  createdAt!: Date;

  @ClassField(() => Date)
  @Expose()
  updatedAt!: Date;

  // Backwards-compatibility aliases for frontend
  @Expose()
  @Transform(({ obj }) => obj.subjectType, { toClassOnly: true })
  entity?: string;

  @Expose()
  @Transform(({ obj }) => (obj.subjectId ? String(obj.subjectId) : undefined), {
    toClassOnly: true,
  })
  entityId?: string;

  @Expose()
  @Transform(({ obj }) => obj.event, { toClassOnly: true })
  action?: string;

  @Expose()
  @Transform(({ obj }) => obj.causerId, { toClassOnly: true })
  userId?: string;

  @Expose()
  @Transform(({ obj }) => obj.properties?.old, { toClassOnly: true })
  oldValue?: any;

  @Expose()
  @Transform(({ obj }) => obj.properties?.attributes, { toClassOnly: true })
  newValue?: any;

  @Expose()
  @Transform(({ obj }) => obj.properties?.ip, { toClassOnly: true })
  ip?: string;

  @Expose()
  @Transform(({ obj }) => obj.properties?.userAgent, { toClassOnly: true })
  userAgent?: string;

  @Expose()
  @Transform(({ obj }) => obj.properties?.requestId, { toClassOnly: true })
  requestId?: string;

  @Expose()
  @Transform(({ obj }) => obj.properties, { toClassOnly: true })
  metadata?: any;

  @Expose()
  @Transform(({ obj }) => obj.properties?.changes ?? [], { toClassOnly: true })
  changes?: AuditLogChangeItem[];

  @Expose()
  @Transform(({ obj }) => obj.createdAt, { toClassOnly: true })
  timestamp!: Date;
}

export { AuditLogResDto as ActivityLogResDto };
