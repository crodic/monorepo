import { CaslAbilityFactory } from '../../shared/casl/ability.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminRoleController } from './admin-role.controller';
import { AdminRoleService } from './admin-role.service';
import { ClsService } from 'nestjs-cls';
import { Reflector } from '@nestjs/core';

describe('AdminRoleController', () => {
  let controller: AdminRoleController;

  const mockRoleService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
    formOptions: jest.fn(),
  };

  const mockClsService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRoleController],
      providers: [
        {
          provide: AdminRoleService,
          useValue: mockRoleService,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        Reflector,
        CaslAbilityFactory,
      ],
    }).compile();

    controller = module.get<AdminRoleController>(AdminRoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
