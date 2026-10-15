import { ActivityLogEntity } from '../entities/activity-log.entity';

export interface LogOptions {
  logAll?: boolean;
  dontLogEmptyChanges?: boolean;
  logExcept?: string[];
  logOnly?: string[];
}

export interface ILogsActivity {
  getActivitylogOptions?(): LogOptions;
  tapActivity?(activity: ActivityLogEntity, eventName: string): void;
}
