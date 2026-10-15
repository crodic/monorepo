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
  firstName: 'Tên (First Name)',
  lastName: 'Họ (Last Name)',
  fullName: 'Họ và tên (Full Name)',
  first_name: 'Tên (First Name)',
  last_name: 'Họ (Last Name)',
  full_name: 'Họ và tên (Full Name)',
  email: 'Email',
  phone: 'Số điện thoại',
  bio: 'Tiểu sử',
  avatar: 'Ảnh đại diện',
  birthday: 'Ngày sinh',
  name: 'Tên',
  description: 'Mô tả',
  isSystem: 'Quyền hệ thống',
  is_system: 'Quyền hệ thống',
  group: 'Nhóm phân loại',
  key: 'Mã định danh (Key)',
  roleIds: 'Vai trò (Roles)',
  permissionIds: 'Quyền hạn (Permissions)',
  status: 'Trạng thái',
  title: 'Tiêu đề',
  slug: 'Đường dẫn (Slug)',
  content: 'Nội dung',
  locale: 'Ngôn ngữ',
  target: 'Đối tượng áp dụng',
  brandName: 'Tên thương hiệu',
  siteTitle: 'Tiêu đề trang',
  isActive: 'Trạng thái kích hoạt',
  is_active: 'Trạng thái kích hoạt',
  notifications: 'Cài đặt thông báo',
  twoFactorEnabled: 'Bảo mật 2 lớp (2FA)',
  two_factor_enabled: 'Bảo mật 2 lớp (2FA)',
  verifiedAt: 'Thời gian xác minh',
  verified_at: 'Thời gian xác minh',
};

function formatValueForUser(value: any): string {
  if (value === null || value === undefined) return '(Trống)';
  if (typeof value === 'boolean') return value ? 'Bật (True)' : 'Tắt (False)';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length === 0
        ? '(Danh sách trống)'
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
        'Quản trị viên';

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
    if (!rawName) return 'Dữ liệu';
    const nameWithoutEntity = rawName.replace(/Entity$/, '');
    const customMap: Record<string, string> = {
      AdminUser: 'Quản trị viên (Admin User)',
      User: 'Người dùng (User)',
      AdminRole: 'Vai trò (Admin Role)',
      Role: 'Vai trò (Role)',
      AdminPermission: 'Quyền hạn (Admin Permission)',
      Permission: 'Quyền hạn (Permission)',
      CmsPage: 'Trang CMS',
      CmsPageTranslation: 'Bản dịch trang CMS',
      EmailLog: 'Nhật ký Email',
      Setting: 'Cấu hình hệ thống',
      WhiteLabel: 'Cấu hình thương hiệu (White Label)',
      File: 'Tập tin',
      FileFolder: 'Thư mục tập tin',
      Country: 'Quốc gia',
      State: 'Tỉnh/Bang',
      City: 'Thành phố',
      Region: 'Khu vực',
      UserAccount: 'Tài khoản người dùng',
      AdminAccount: 'Tài khoản quản trị',
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
        return `${actorName} đã tạo mới ${target}`;
      case 'UPDATE': {
        if (changes.length > 0) {
          const changeSummaries = changes
            .slice(0, 3)
            .map((c) => `đổi ${c.label} từ '${c.from}' thành '${c.to}'`);
          const moreCount = changes.length - 3;
          const moreText = moreCount > 0 ? ` và ${moreCount} mục khác` : '';
          return `${actorName} đã cập nhật ${target}: ${changeSummaries.join(', ')}${moreText}`;
        }
        return `${actorName} đã cập nhật thông tin ${target}`;
      }
      case 'SOFT_DELETE':
        return `${actorName} đã chuyển ${target} vào thùng rác`;
      case 'DELETE':
        return `${actorName} đã xoá vĩnh viễn ${target}`;
      case 'RESTORE':
        return `${actorName} đã khôi phục ${target}`;
      default:
        return `${actorName} đã thực hiện thao tác ${action} trên ${target}`;
    }
  }
}
