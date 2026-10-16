import 'reflect-metadata';
import { AdminPermissionEntity } from '../api/admin-permission/entities/admin-permission.entity';
import { syncPermissions } from '../api/admin-permission/permission-sync';
import { AppDataSource } from './data-source';

async function run() {
  await AppDataSource.initialize();

  try {
    await syncPermissions(AppDataSource.getRepository(AdminPermissionEntity));
    console.info('Permissions synced successfully.');
  } finally {
    await AppDataSource.destroy();
  }
}

void run().catch((error) => {
  console.error('Failed to sync permissions.', error);
  process.exit(1);
});
