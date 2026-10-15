import { CaslAbilityFactory } from '../../shared/casl/ability.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { ClsService } from 'nestjs-cls';
import { Reflector } from '@nestjs/core';

describe('PermissionController', () => {
  let controller: PermissionController;

  const mockPermissionService = {
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
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        Reflector,
        CaslAbilityFactory,
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
