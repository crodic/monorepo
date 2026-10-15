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
  entity!: string;

  @StringFieldOptional()
  @Expose()
  entityId?: string;

  @StringField()
  @Expose()
  action!: string;

  @Expose()
  oldValue?: any;

  @Expose()
  newValue?: any;

  @StringFieldOptional()
  @Expose()
  userId?: string;

  @StringFieldOptional()
  @Expose()
  description?: string;

  @StringFieldOptional()
  @Expose()
  ip?: string;

  @StringFieldOptional()
  @Expose()
  userAgent?: string;

  @StringFieldOptional()
  @Expose()
  requestId?: string;

  @Expose()
  metadata?: any;

  @Expose()
  @Transform(({ obj }) => obj.metadata?.changes ?? [], { toClassOnly: true })
  changes?: AuditLogChangeItem[];

  @ClassField(() => Date)
  @Expose()
  timestamp!: Date;
}
