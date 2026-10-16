import 'reflect-metadata';
import { AdminPermissionEntity } from '../api/admin-permission/entities/admin-permission.entity';
import { cleanPermissions } from '../api/admin-permission/permission-clean';
import { AppDataSource } from './data-source';

async function run() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  await AppDataSource.initialize();

  try {
    await cleanPermissions(
      AppDataSource.getRepository(AdminPermissionEntity),
      force,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

void run().catch((error) => {
  console.error('Failed to clean permissions.', error);
  process.exit(1);
});
