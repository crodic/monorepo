import { INestApplication } from '@nestjs/common';
import {
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  expect,
} from '@jest/globals';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { cleanDatabase, createTestApp, getAdminAuthToken } from './test-utils';
import { ActivityLogEntity } from '../src/api/audit-log/entities/activity-log.entity';
import { AdminPermissionEntity } from '../src/api/admin-permission/entities/admin-permission.entity';

describe('Activity & Audit Log (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Fresh DB before every test case: truncate all tables & reset sequences
    await cleanDatabase(dataSource);
  });

  it('starts with a completely empty activity_logs table on a fresh database', async () => {
    const logRepo = dataSource.getRepository(ActivityLogEntity);
    const count = await logRepo.count();

    expect(count).toBe(0);
  });

  it('records an activity log when an admin creates a role and queries via /api/v1/activity-logs', async () => {
    const token = await getAdminAuthToken(app);
    const permRepo = dataSource.getRepository(AdminPermissionEntity);
    let perm = await permRepo.findOneBy({ key: 'read:ROLE' });
    if (!perm) {
      perm = await permRepo.save(
        permRepo.create({
          name: 'View Roles',
          group: 'Roles',
          key: 'read:ROLE',
        }),
      );
    }

    // 1. Create a new Admin Role via API
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Finance Manager',
        description: 'Manages financial records',
        permissionIds: [String(perm.id)],
      })
      .expect(200);

    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.name).toBe('Finance Manager');

    // Wait slightly for setImmediate async log persistence
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 2. Query activity logs endpoint
    const logsRes = await request(app.getHttpServer())
      .get('/api/v1/activity-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(logsRes.body).toHaveProperty('data');
    expect(Array.isArray(logsRes.body.data)).toBe(true);

    const roleLog = logsRes.body.data.find(
      (item: any) => item.description === 'AdminRole: Finance Manager',
    );
    expect(roleLog).toBeDefined();
    expect(roleLog.event).toBe('create');
    expect(roleLog.subjectType).toBe('AdminRoleEntity');
    expect(roleLog.causerType).toBe('AdminUserEntity');
  });

  it('guarantees fresh database isolation: previous test records are completely wiped', async () => {
    const logRepo = dataSource.getRepository(ActivityLogEntity);
    const count = await logRepo.count();

    // Must be 0 because cleanDatabase ran in beforeEach!
    expect(count).toBe(0);
  });
});
