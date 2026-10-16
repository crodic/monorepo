import { AdminPermissionEntity } from '../api/admin-permission/entities/admin-permission.entity';
import { AdminRoleEntity } from '../api/admin-role/entities/admin-role.entity';
import { AdminUserEntity } from '../api/admin-user/entities/admin-user.entity';
import {
  CHECK_ANY_POLICIES_KEY,
  CHECK_POLICIES_KEY,
} from '../decorators/policies.decorator';
import { CaslAbilityFactory } from '../shared/casl/ability.factory';
import { AppActions, AppSubjects } from '../utils/permissions.constant';
import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PoliciesGuard } from './policies.guard';

describe('PoliciesGuard', () => {
  let guard: PoliciesGuard;
  let reflector: Reflector;
  let caslFactory: CaslAbilityFactory;

  beforeEach(() => {
    reflector = new Reflector();
    caslFactory = new CaslAbilityFactory();
    guard = new PoliciesGuard(reflector, caslFactory);
  });

  const createMockContext = (user: AdminUserEntity): ExecutionContext => {
    const request = { user };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })),
    } as unknown as ExecutionContext;
  };

  it('allows access if route is public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'isPublic') return true;
      return false;
    });

    const context = createMockContext(new AdminUserEntity());
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access if policies are satisfied', () => {
    const user = new AdminUserEntity({
      roles: [
        new AdminRoleEntity({
          permissionEntities: [
            new AdminPermissionEntity({
              key: `${AppActions.Read}:${AppSubjects.Role}`,
            }),
          ],
        }),
      ],
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === CHECK_POLICIES_KEY) {
        return [
          (ability: any) => ability.can(AppActions.Read, AppSubjects.Role),
        ];
      }
      return false;
    });

    const context = createMockContext(user);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access if policy check fails', () => {
    const user = new AdminUserEntity({ roles: [] });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === CHECK_POLICIES_KEY) {
        return [
          (ability: any) => ability.can(AppActions.Read, AppSubjects.Role),
        ];
      }
      return false;
    });

    const context = createMockContext(user);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('throws InternalServerErrorException if both CheckPolicies and CheckAnyPolicies are used', () => {
    const user = new AdminUserEntity();

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === CHECK_POLICIES_KEY) return [() => true];
      if (key === CHECK_ANY_POLICIES_KEY) return [() => true];
      return false;
    });

    const context = createMockContext(user);
    expect(() => guard.canActivate(context)).toThrow(
      InternalServerErrorException,
    );
  });
});
