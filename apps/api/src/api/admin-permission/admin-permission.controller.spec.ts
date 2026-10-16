import { CaslAbilityFactory } from '../../shared/casl/ability.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminPermissionController } from './admin-permission.controller';
import { AdminPermissionService } from './admin-permission.service';
import { ClsService } from 'nestjs-cls';
import { Reflector } from '@nestjs/core';

describe('AdminPermissionController', () => {
  let controller: AdminPermissionController;

  const mockAdminPermissionService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    formOptions: jest.fn(),
    update: jest.fn(),
  };

  const mockClsService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPermissionController],
      providers: [
        {
          provide: AdminPermissionService,
          useValue: mockAdminPermissionService,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        Reflector,
        CaslAbilityFactory,
      ],
    }).compile();

    controller = module.get<AdminPermissionController>(
      AdminPermissionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
