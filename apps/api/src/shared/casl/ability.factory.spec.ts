import { AdminPermissionEntity } from '../../api/admin-permission/entities/admin-permission.entity';
import { AdminRoleEntity } from '../../api/admin-role/entities/admin-role.entity';
import { AdminUserEntity } from '../../api/admin-user/entities/admin-user.entity';
import { AppActions, AppSubjects } from '../../utils/permissions.constant';
import { CaslAbilityFactory } from './ability.factory';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;

  beforeEach(() => {
    factory = new CaslAbilityFactory();
  });

  it('grants permissions matching role permission keys', () => {
    const permissions = [
      new AdminPermissionEntity({
        key: `${AppActions.Read}:${AppSubjects.User}`,
      }),
      new AdminPermissionEntity({
        key: `${AppActions.Create}:${AppSubjects.User}`,
      }),
    ];
    const role = new AdminRoleEntity({ permissionEntities: permissions });
    const user = new AdminUserEntity({ roles: [role] });

    const ability = factory.createForUser(user);

    expect(ability.can(AppActions.Read, AppSubjects.User)).toBe(true);
    expect(ability.can(AppActions.Create, AppSubjects.User)).toBe(true);
    expect(ability.can(AppActions.Delete, AppSubjects.User)).toBe(false);
  });

  it('handles user with empty or undefined roles', () => {
    const user = new AdminUserEntity({ roles: [] });
    const ability = factory.createForUser(user);

    expect(ability.can(AppActions.Read, AppSubjects.User)).toBe(false);
  });
});
