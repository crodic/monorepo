import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdminPermissionEntity } from '../../../api/admin-permission/entities/admin-permission.entity';
import { syncPermissions } from '../../../api/admin-permission/permission-sync';
import { AdminRoleEntity } from '../../../api/admin-role/entities/admin-role.entity';
import { AdminAccountEntity } from '../../../api/admin-user/entities/admin-account.entity';
import { AdminUserEntity } from '../../../api/admin-user/entities/admin-user.entity';
import {
  SUPER_ADMIN_ACCOUNT,
  SYSTEM_ROLE_NAME,
} from '../../../common/constants/app.constant';
import { EAccountProvider } from '../../../common/constants/entity.enum';
import { ADMIN_FULL_ACCESS } from '../../../utils/permissions.constant';

@Injectable()
export class AdminSeedService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminUserRepository: Repository<AdminUserEntity>,
    @InjectRepository(AdminAccountEntity)
    private readonly adminAccountRepository: Repository<AdminAccountEntity>,
    @InjectRepository(AdminPermissionEntity)
    private readonly permissionRepository: Repository<AdminPermissionEntity>,
    @InjectRepository(AdminRoleEntity)
    private readonly roleRepository: Repository<AdminRoleEntity>,
  ) {}

  async run(): Promise<void> {
    await syncPermissions(this.permissionRepository);

    const permissions = await this.permissionRepository.findBy({
      key: In([`${ADMIN_FULL_ACCESS.action}:${ADMIN_FULL_ACCESS.subject}`]),
    });

    let superAdminRole = await this.roleRepository.findOne({
      where: { name: SYSTEM_ROLE_NAME },
      relations: ['permissionEntities'],
    });

    if (!superAdminRole) {
      superAdminRole = this.roleRepository.create({
        name: SYSTEM_ROLE_NAME,
        description: 'System role',
        isSystem: true,
        permissionEntities: permissions,
      });
    } else {
      superAdminRole.isSystem = true;
      superAdminRole.permissionEntities = permissions;
    }

    superAdminRole = await this.roleRepository.save(superAdminRole);

    let existingAdmin = await this.adminUserRepository.findOne({
      where: { email: SUPER_ADMIN_ACCOUNT.email },
      withDeleted: true,
    });

    if (!existingAdmin) {
      existingAdmin = await this.adminUserRepository.save(
        this.adminUserRepository.create({
          email: SUPER_ADMIN_ACCOUNT.email,
          firstName: 'System',
          lastName: 'Administrator',
          roles: [superAdminRole],
          verifiedAt: new Date(),
        }),
      );
    }

    const existingAccount = await this.adminAccountRepository.findOne({
      where: {
        adminUserId: existingAdmin.id,
        provider: EAccountProvider.LOCAL,
      },
    });

    if (!existingAccount) {
      await this.adminAccountRepository.save(
        new AdminAccountEntity({
          adminUserId: existingAdmin.id,
          provider: EAccountProvider.LOCAL,
          providerAccountId: existingAdmin.email,
          password: SUPER_ADMIN_ACCOUNT.password,
        }),
      );
    }
  }
}
