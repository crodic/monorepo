import { AdminSessionEntity } from '../../auth/entities/admin-session.entity';
import { UserSessionEntity } from '../../auth/entities/user-session.entity';
import { EmailLogEntity } from '../../email/entities/email-log.entity';
import { Logger } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
  RemoveEvent,
  SoftRemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { ActivityLogEntity } from '../entities/activity-log.entity';
import { LogOptions } from '../interfaces/logs-activity.interface';

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValueForUser(value: any): string {
  if (value === null || value === undefined) return '(Empty)';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length === 0
        ? '(Empty list)'
        : value.map((v) => formatValueForUser(v)).join(', ');
    }
    return JSON.stringify(value);
  }
  return String(value);
}

@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AuditLogSubscriber.name);
  private readonly ignoreEntities = [
    ActivityLogEntity.name,
    AdminSessionEntity.name,
    UserSessionEntity.name,
    EmailLogEntity.name,
  ];

  private readonly defaultExcept = [
    'password',
    'previousPassword',
    'twoFactorSecret',
    'twoFactorBackupCodes',
    'hash',
    'token',
    'salt',
    'rememberToken',
    'remember_token',
  ];

  constructor(private dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<any>) {
    await this.saveLog('INSERT', event);
  }

  async afterUpdate(event: UpdateEvent<any>) {
    await this.saveLog('UPDATE', event);
  }

  async afterRemove(event: RemoveEvent<any>) {
    await this.saveLog('DELETE', event);
  }

  async afterSoftRemove(event: SoftRemoveEvent<any>) {
    await this.saveLog('SOFT_DELETE', event);
  }

  async afterRecover(event: RecoverEvent<any>) {
    await this.saveLog('RESTORE', event);
  }

  private resolveModelKey(modelBaseName: string): string {
    const keyMap: Record<string, string> = {
      AdminUser: 'fullName',
      User: 'fullName',
      Member: 'fullName',
      AdminRole: 'name',
      Role: 'name',
      AdminPermission: 'name',
      Permission: 'name',
      CmsPage: 'title',
      CmsPageTranslation: 'title',
      WhiteLabel: 'brandName',
      File: 'originalName',
      FileFolder: 'name',
      Country: 'name',
      State: 'name',
      City: 'name',
      Region: 'name',
      Setting: 'key',
    };
    return keyMap[modelBaseName] || 'id';
  }

  private mapActionToEventName(
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'SOFT_DELETE',
  ): string {
    switch (action) {
      case 'INSERT':
        return 'created';
      case 'UPDATE':
        return 'updated';
      case 'DELETE':
        return 'deleted';
      case 'SOFT_DELETE':
        return 'soft_deleted';
      case 'RESTORE':
        return 'restored';
      default:
        return String(action).toLowerCase();
    }
  }

  private defaultTapActivity(
    activity: ActivityLogEntity,
    eventName: string,
    modelBaseName: string,
    targetEntity: any,
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    actorName: string,
    causerType: string | null,
  ) {
    const key = this.resolveModelKey(modelBaseName);

    const oldAttributes = activity.properties?.old ?? {};
    const newAttributes = activity.properties?.attributes ?? {};

    const targetIdentifier =
      newAttributes[key] ??
      oldAttributes[key] ??
      targetEntity?.[key] ??
      targetEntity?.name ??
      targetEntity?.fullName ??
      targetEntity?.title ??
      targetEntity?.id ??
      activity.subjectId;

    switch (eventName) {
      case 'created':
        activity.description = `${modelBaseName}: ${targetIdentifier}`;
        activity.event = 'create';
        break;
      case 'updated':
        activity.description = `${modelBaseName}: ${targetIdentifier}`;
        activity.event = 'update';
        break;
      case 'deleted':
      case 'soft_deleted':
        activity.description = `${modelBaseName}: ${targetIdentifier}`;
        activity.event = 'delete';
        break;
      case 'restored':
        activity.description = `${modelBaseName}: ${targetIdentifier}`;
        activity.event = 'restore';
        break;
      default:
        activity.description = `${modelBaseName}: ${targetIdentifier}`;
        activity.event = eventName;
        break;
    }

    if (activity.properties) {
      activity.properties.causer_name = actorName;
    }

    if (activity.causerId != null) {
      activity.causerType = causerType || 'AdminUserEntity';
    }
  }

  private async saveLog(
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'SOFT_DELETE',
    event: any,
  ) {
    const targetEntity = event.entity ?? event.databaseEntity ?? {};
    const entityId =
      event.entity?.id ?? event.databaseEntity?.id ?? event.entityId;

    if (
      (!event.entity && !event.databaseEntity) ||
      !entityId ||
      this.ignoreEntities.includes(event.metadata.name)
    )
      return;

    const options: LogOptions =
      typeof targetEntity.getActivitylogOptions === 'function'
        ? targetEntity.getActivitylogOptions()
        : {
            dontLogEmptyChanges: true,
            logExcept: this.defaultExcept,
            logAll: true,
          };

    const excludeFields = options.logExcept ?? this.defaultExcept;
    const cls = ClsServiceManager.getClsService();
    const auditRepo = event.manager.getRepository(ActivityLogEntity);
    const currentUser = cls.get('user') ?? {};
    const userId = currentUser?.id;

    const oldValue: Record<string, any> = {};
    const newValue: Record<string, any> = {};
    const changedFields: string[] = [];
    const changes: Array<{ field: string; label: string; from: any; to: any }> =
      [];

    const keysToInspect = new Set([
      ...Object.keys(event.databaseEntity ?? {}),
      ...Object.keys(event.entity ?? {}),
    ]);

    for (const key of keysToInspect) {
      if (excludeFields.includes(key)) continue;
      if (options.logOnly && !options.logOnly.includes(key)) continue;

      const oldVal = event.databaseEntity?.[key];
      const newVal = event.entity?.[key];

      if (oldVal !== undefined) oldValue[key] = oldVal;
      if (newVal !== undefined) newValue[key] = newVal;

      if (
        action === 'UPDATE' &&
        oldVal !== undefined &&
        newVal !== undefined &&
        !['updatedAt', 'updated_at', 'createdAt', 'created_at', 'id'].includes(
          key,
        )
      ) {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changedFields.push(key);
          changes.push({
            field: key,
            label: formatFieldLabel(key),
            from: formatValueForUser(oldVal),
            to: formatValueForUser(newVal),
          });
        }
      }
    }

    // dontLogEmptyChanges logic from Spatie
    if (
      action === 'UPDATE' &&
      options.dontLogEmptyChanges !== false &&
      changedFields.length === 0
    ) {
      return;
    }

    const causerId = currentUser?.id ? String(currentUser.id) : null;
    const rawUserType = cls.get('userType');
    const causerType = causerId ? rawUserType || 'AdminUserEntity' : null;
    const actorName =
      currentUser?.fullName ??
      (currentUser?.firstName || currentUser?.lastName
        ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim()
        : null) ??
      currentUser?.email ??
      (causerId ? 'Administrator' : 'System');

    const modelBaseName = event.metadata.name.replace(/Entity$/, '');
    const eventName = this.mapActionToEventName(action);

    const log = auditRepo.create({
      logName: 'default',
      subjectType: event.metadata.name,
      subjectId: entityId ? (entityId as any) : null,
      causerType,
      causerId,
      event: eventName,
      batchUuid: cls.get('batchUuid') ?? null,
      properties: {
        attributes: Object.keys(newValue).length > 0 ? newValue : undefined,
        old: Object.keys(oldValue).length > 0 ? oldValue : undefined,
        changedFields: changedFields.length > 0 ? changedFields : undefined,
        changes: changes.length > 0 ? changes : undefined,
        actorId: causerId,
        actorEmail: currentUser?.email ?? null,
        causer_name: actorName,
        roles: currentUser?.roles?.map((role: any) => role.name) ?? [],
        ip: cls.get('ip'),
        userAgent: cls.get('userAgent'),
        requestId: cls.get('requestId'),
      },
    });

    // Execute tapActivity (either custom defined on entity or default tapActivity)
    if (typeof targetEntity.tapActivity === 'function') {
      targetEntity.tapActivity(log, eventName);
    } else {
      this.defaultTapActivity(
        log,
        eventName,
        modelBaseName,
        targetEntity,
        oldValue,
        newValue,
        actorName,
        causerType,
      );
    }

    setImmediate(() => auditRepo.save(log));
  }
}
