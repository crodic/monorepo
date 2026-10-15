import { CaslAbilityFactory } from '../../shared/casl/ability.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { ClsService } from 'nestjs-cls';
import { Reflector } from '@nestjs/core';

describe('RoleController', () => {
  let controller: RoleController;

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
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
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

    controller = module.get<RoleController>(RoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
