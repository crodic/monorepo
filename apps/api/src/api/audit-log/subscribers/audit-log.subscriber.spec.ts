import { ClsServiceManager } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { ActivityLogEntity } from '../entities/activity-log.entity';
import { FileUploadSessionEntity } from '../../file/entities/file-upload-session.entity';
import { AuditLogSubscriber } from './audit-log.subscriber';

describe('AuditLogSubscriber', () => {
  let subscriber: AuditLogSubscriber;
  let mockDataSource: any;
  let mockAuditRepo: any;

  beforeEach(() => {
    mockDataSource = {
      subscribers: [],
    };
    mockAuditRepo = {
      create: jest.fn((log) => log),
      save: jest.fn().mockResolvedValue(true),
    };
    subscriber = new AuditLogSubscriber(
      mockDataSource as unknown as DataSource,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be registered to dataSource subscribers', () => {
    expect(mockDataSource.subscribers).toContain(subscriber);
  });

  it('generates formatted description on INSERT of an AdminUserEntity', async () => {
    const cls = {
      get: jest.fn((key: string) => {
        if (key === 'user')
          return {
            id: '1',
            fullName: 'Super Admin',
            email: 'admin@domain.com',
            roles: [{ name: 'ADMIN' }],
          };
        if (key === 'userType') return 'AdminUserEntity';
        if (key === 'ip') return '127.0.0.1';
        if (key === 'userAgent') return 'Mozilla/5.0';
        if (key === 'requestId') return 'req-123';
        return null;
      }),
    };
    jest.spyOn(ClsServiceManager, 'getClsService').mockReturnValue(cls as any);

    const event = {
      metadata: { name: 'AdminUserEntity' },
      entity: { id: '10', fullName: 'Jane Doe', email: 'jane@domain.com' },
      manager: {
        getRepository: jest.fn().mockReturnValue(mockAuditRepo),
      },
    };

    await subscriber.afterInsert(event as any);

    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        logName: 'default',
        subjectType: 'AdminUserEntity',
        subjectId: '10',
        causerType: 'AdminUserEntity',
        causerId: '1',
        event: 'create',
        description: 'AdminUser: Jane Doe',
        properties: expect.objectContaining({
          causer_name: 'Super Admin',
          attributes: expect.objectContaining({
            fullName: 'Jane Doe',
            email: 'jane@domain.com',
          }),
        }),
      }),
    );
  });

  it('generates formatted description on UPDATE of AdminRoleEntity', async () => {
    const cls = {
      get: jest.fn((key: string) => {
        if (key === 'user') return { id: '1', fullName: 'Super Admin' };
        if (key === 'userType') return 'AdminUserEntity';
        return null;
      }),
    };
    jest.spyOn(ClsServiceManager, 'getClsService').mockReturnValue(cls as any);

    const event = {
      metadata: { name: 'AdminRoleEntity' },
      entity: {
        id: '2',
        name: 'Manager',
        description: 'Updated role description',
      },
      databaseEntity: {
        id: '2',
        name: 'Manager',
        description: 'Old role description',
      },
      manager: {
        getRepository: jest.fn().mockReturnValue(mockAuditRepo),
      },
    };

    await subscriber.afterUpdate(event as any);

    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        logName: 'default',
        subjectType: 'AdminRoleEntity',
        subjectId: '2',
        causerType: 'AdminUserEntity',
        causerId: '1',
        event: 'update',
        description: 'AdminRole: Manager',
        properties: expect.objectContaining({
          changedFields: ['description'],
          old: expect.objectContaining({
            description: 'Old role description',
          }),
          attributes: expect.objectContaining({
            description: 'Updated role description',
          }),
        }),
      }),
    );
  });

  it('does not log on UPDATE if dontLogEmptyChanges is true and nothing changed', async () => {
    const cls = {
      get: jest.fn((key: string) => {
        if (key === 'user') return { id: '1', fullName: 'Super Admin' };
        if (key === 'userType') return 'AdminUserEntity';
        return null;
      }),
    };
    jest.spyOn(ClsServiceManager, 'getClsService').mockReturnValue(cls as any);

    const event = {
      metadata: { name: 'AdminRoleEntity' },
      entity: {
        id: '2',
        name: 'Manager',
        description: 'Same description',
      },
      databaseEntity: {
        id: '2',
        name: 'Manager',
        description: 'Same description',
      },
      manager: {
        getRepository: jest.fn().mockReturnValue(mockAuditRepo),
      },
    };

    await subscriber.afterUpdate(event as any);

    expect(mockAuditRepo.create).not.toHaveBeenCalled();
  });

  it('generates formatted description on SOFT_DELETE of CmsPageEntity', async () => {
    const cls = {
      get: jest.fn((key: string) => {
        if (key === 'user') return { id: '1', fullName: 'Super Admin' };
        if (key === 'userType') return 'AdminUserEntity';
        return null;
      }),
    };
    jest.spyOn(ClsServiceManager, 'getClsService').mockReturnValue(cls as any);

    const event = {
      metadata: { name: 'CmsPageEntity' },
      entity: { id: '5', title: 'Privacy Policy' },
      databaseEntity: { id: '5', title: 'Privacy Policy' },
      manager: {
        getRepository: jest.fn().mockReturnValue(mockAuditRepo),
      },
    };

    await subscriber.afterSoftRemove(event as any);

    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        logName: 'default',
        subjectType: 'CmsPageEntity',
        subjectId: '5',
        causerType: 'AdminUserEntity',
        causerId: '1',
        event: 'delete',
        description: 'CmsPage: Privacy Policy',
      }),
    );
  });

  it('delegates to custom tapActivity method on entity if present', async () => {
    const cls = {
      get: jest.fn((key: string) => {
        if (key === 'user') return { id: '1', fullName: 'Super Admin' };
        if (key === 'userType') return 'AdminUserEntity';
        return null;
      }),
    };
    jest.spyOn(ClsServiceManager, 'getClsService').mockReturnValue(cls as any);

    const customTap = jest.fn((activity, eventName) => {
      activity.description = `Custom: ${eventName}`;
    });

    const event = {
      metadata: { name: 'CustomEntity' },
      entity: {
        id: '99',
        name: 'Special Item',
        tapActivity: customTap,
      },
      manager: {
        getRepository: jest.fn().mockReturnValue(mockAuditRepo),
      },
    };

    await subscriber.afterInsert(event as any);

    expect(customTap).toHaveBeenCalledWith(expect.any(Object), 'created');
    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Custom: created',
      }),
    );
  });

  it('does not log ignored entities like ActivityLogEntity, AdminSessionEntity, or FileUploadSessionEntity', async () => {
    const ignoredNames = [ActivityLogEntity.name, FileUploadSessionEntity.name];

    for (const name of ignoredNames) {
      const event = {
        metadata: { name },
        entity: { id: 'some-id' },
        manager: {
          getRepository: jest.fn().mockReturnValue(mockAuditRepo),
        },
      };

      await subscriber.afterInsert(event as any);
    }

    expect(mockAuditRepo.create).not.toHaveBeenCalled();
  });

  it('safely handles non-numeric entity IDs by setting subjectId to null', async () => {
    const cls = {
      get: jest.fn(() => null),
    };
    jest.spyOn(ClsServiceManager, 'getClsService').mockReturnValue(cls as any);

    const event = {
      metadata: { name: 'NonNumericEntity' },
      entity: {
        id: '0aad2ec19bc84bfea89e8bd99560f734',
        name: 'Some Non-Numeric Resource',
      },
      manager: {
        getRepository: jest.fn().mockReturnValue(mockAuditRepo),
      },
    };

    await subscriber.afterInsert(event as any);

    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectType: 'NonNumericEntity',
        subjectId: null,
        properties: expect.objectContaining({
          entityId: '0aad2ec19bc84bfea89e8bd99560f734',
        }),
      }),
    );
  });

  it('logs system or guest actions when there is no authenticated user', async () => {
    const cls = {
      get: jest.fn(() => null),
    };
    jest.spyOn(ClsServiceManager, 'getClsService').mockReturnValue(cls as any);

    const event = {
      metadata: { name: 'UserEntity' },
      entity: {
        id: '100',
        fullName: 'Guest Registered User',
        email: 'guest@domain.com',
      },
      manager: {
        getRepository: jest.fn().mockReturnValue(mockAuditRepo),
      },
    };

    await subscriber.afterInsert(event as any);

    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        logName: 'default',
        subjectType: 'UserEntity',
        subjectId: '100',
        causerType: null,
        causerId: null,
        event: 'create',
        description: 'User: Guest Registered User',
        properties: expect.objectContaining({
          causer_name: 'System',
          actorId: null,
        }),
      }),
    );
  });

  it('gracefully handles database save errors without throwing or rejecting', async () => {
    mockAuditRepo.save.mockRejectedValueOnce(new Error('DB connection lost'));

    const event = {
      metadata: { name: 'UserEntity' },
      entity: { id: '101', fullName: 'Alice' },
      manager: {
        getRepository: jest.fn().mockReturnValue(mockAuditRepo),
      },
    };

    // Should complete cleanly without throwing
    await expect(subscriber.afterInsert(event as any)).resolves.not.toThrow();

    // Allow setImmediate to run and confirm save was called and error handled
    await new Promise((resolve) => setImmediate(resolve));
    expect(mockAuditRepo.save).toHaveBeenCalled();
  });

  it('gracefully handles synchronous processing errors without throwing', async () => {
    const brokenEvent = {
      get metadata() {
        throw new Error('Broken metadata');
      },
    };

    await expect(
      subscriber.afterInsert(brokenEvent as any),
    ).resolves.not.toThrow();
  });
});
