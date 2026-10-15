import { AdminSessionEntity } from '../../auth/entities/admin-session.entity';
import { UserSessionEntity } from '../../auth/entities/user-session.entity';
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
import { AuditLogEntity } from '../entities/audit-log.entity';

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  fullName: 'Full Name',
  first_name: 'First Name',
  last_name: 'Last Name',
  full_name: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  bio: 'Bio',
  avatar: 'Avatar',
  birthday: 'Birthday',
  name: 'Name',
  description: 'Description',
  isSystem: 'System Flag',
  is_system: 'System Flag',
  group: 'Group',
  key: 'Key',
  roleIds: 'Roles',
  permissionIds: 'Permissions',
  status: 'Status',
  title: 'Title',
  slug: 'Slug',
  content: 'Content',
  locale: 'Locale',
  target: 'Target',
  brandName: 'Brand Name',
  siteTitle: 'Site Title',
  isActive: 'Active Status',
  is_active: 'Active Status',
  notifications: 'Notification Settings',
  twoFactorEnabled: 'Two-Factor Authentication',
  two_factor_enabled: 'Two-Factor Authentication',
  verifiedAt: 'Verified At',
  verified_at: 'Verified At',
};

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
    AuditLogEntity.name,
    AdminSessionEntity.name,
    UserSessionEntity.name,
    'EmailLogEntity',
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

    const excludeFields = [
      'password',
      'previousPassword',
      'twoFactorSecret',
      'twoFactorBackupCodes',
      'hash',
      'token',
      'salt',
    ];
    const cls = ClsServiceManager.getClsService();

    const auditRepo = event.manager.getRepository(AuditLogEntity);
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
            label: FIELD_LABELS[key] || key,
            from: formatValueForUser(oldVal),
            to: formatValueForUser(newVal),
          });
        }
      }
    }

    const userType = cls.get('userType') || 'GuestEntity';

    if (userType === 'AdminUserEntity' || userId) {
      const entityName = this.extractEntityIdentifier(targetEntity);
      const entityLabel = this.formatEntityName(event.metadata.name);
      const actorName =
        currentUser?.fullName ??
        (currentUser?.firstName || currentUser?.lastName
          ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim()
          : null) ??
        currentUser?.email ??
        'Administrator';

      const log = auditRepo.create({
        entity: event.metadata.name,
        entityId,
        action,
        oldValue,
        newValue,
        userId: userId ? String(userId) : null,
        ip: cls.get('ip'),
        userAgent: cls.get('userAgent'),
        requestId: cls.get('requestId'),
        timestamp: new Date(),
        metadata: {
          actorId: userId ? String(userId) : null,
          actorEmail: currentUser?.email ?? null,
          actorName,
          entityName,
          entityLabel,
          changedFields: changedFields.length > 0 ? changedFields : undefined,
          changes: changes.length > 0 ? changes : undefined,
          roles: currentUser?.roles?.map((role: any) => role.name) ?? [],
          userType,
        },
        description: this.buildHumanDescription({
          action,
          actorName,
          entityLabel,
          entityId,
          entityIdentifier: entityName,
          changes,
        }),
      });

      setImmediate(() => auditRepo.save(log));
    }
  }

  private formatEntityName(rawName: string): string {
    if (!rawName) return 'Data';
    const nameWithoutEntity = rawName.replace(/Entity$/, '');
    const customMap: Record<string, string> = {
      AdminUser: 'Admin User',
      User: 'User',
      AdminRole: 'Admin Role',
      Role: 'Role',
      AdminPermission: 'Admin Permission',
      Permission: 'Permission',
      CmsPage: 'CMS Page',
      CmsPageTranslation: 'CMS Page Translation',
      EmailLog: 'Email Log',
      Setting: 'System Setting',
      WhiteLabel: 'White Label',
      File: 'File',
      FileFolder: 'File Folder',
      Country: 'Country',
      State: 'State',
      City: 'City',
      Region: 'Region',
      UserAccount: 'User Account',
      AdminAccount: 'Admin Account',
    };
    if (customMap[nameWithoutEntity]) {
      return customMap[nameWithoutEntity];
    }
    return nameWithoutEntity.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  }

  private extractEntityIdentifier(entity: any): string | null {
    if (!entity) return null;
    if (entity.name && typeof entity.name === 'string')
      return entity.name.trim();
    if (entity.fullName && typeof entity.fullName === 'string')
      return entity.fullName.trim();
    if (entity.firstName || entity.lastName) {
      const fullName =
        `${entity.firstName ?? ''} ${entity.lastName ?? ''}`.trim();
      if (fullName) return fullName;
    }
    if (entity.title && typeof entity.title === 'string')
      return entity.title.trim();
    if (entity.email && typeof entity.email === 'string')
      return entity.email.trim();
    if (entity.username && typeof entity.username === 'string')
      return entity.username.trim();
    if (entity.key && typeof entity.key === 'string') return entity.key.trim();
    if (entity.slug && typeof entity.slug === 'string')
      return entity.slug.trim();
    if (entity.originalName && typeof entity.originalName === 'string')
      return entity.originalName.trim();
    if (entity.fileName && typeof entity.fileName === 'string')
      return entity.fileName.trim();
    return null;
  }

  private buildHumanDescription({
    action,
    actorName,
    entityLabel,
    entityId,
    entityIdentifier,
    changes = [],
  }: {
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'SOFT_DELETE';
    actorName: string;
    entityLabel: string;
    entityId: string | number;
    entityIdentifier?: string | null;
    changes?: Array<{ field: string; label: string; from: any; to: any }>;
  }): string {
    const target = entityIdentifier
      ? `${entityLabel} "${entityIdentifier}" (#${entityId})`
      : `${entityLabel} (#${entityId})`;

    switch (action) {
      case 'INSERT':
        return `${actorName} created ${target}`;
      case 'UPDATE': {
        if (changes.length > 0) {
          const changeSummaries = changes
            .slice(0, 3)
            .map((c) => `changed ${c.label} from '${c.from}' to '${c.to}'`);
          const moreCount = changes.length - 3;
          const moreText = moreCount > 0 ? ` and ${moreCount} more` : '';
          return `${actorName} updated ${target}: ${changeSummaries.join(', ')}${moreText}`;
        }
        return `${actorName} updated ${target}`;
      }
      case 'SOFT_DELETE':
        return `${actorName} moved ${target} to trash`;
      case 'DELETE':
        return `${actorName} permanently deleted ${target}`;
      case 'RESTORE':
        return `${actorName} restored ${target}`;
      default:
        return `${actorName} performed ${action} on ${target}`;
    }
  }
}
