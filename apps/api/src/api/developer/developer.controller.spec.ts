import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { AdminAuthGuard } from '../../guards/admin-auth.guard';
import { PoliciesGuard } from '../../guards/policies.guard';
import { CaslAbilityFactory } from '../../shared/casl/ability.factory';
import { setOpenApiDocument } from '../../utils/setup-swagger';
import { DeveloperController } from './developer.controller';

describe('DeveloperController', () => {
  let controller: DeveloperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeveloperController],
      providers: [
        Reflector,
        CaslAbilityFactory,
        {
          provide: ClsService,
          useValue: { get: jest.fn() },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DeveloperController>(DeveloperController);
  });

  afterEach(() => {
    setOpenApiDocument(null);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw NotFoundException when OpenAPI spec is not available', () => {
    setOpenApiDocument(null);
    expect(() => controller.getOpenApiSpec()).toThrow(NotFoundException);
  });

  it('should return OpenAPI document when available', () => {
    const mockDoc = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    } as any;

    setOpenApiDocument(mockDoc);
    const result = controller.getOpenApiSpec();
    expect(result).toEqual(mockDoc);
  });
});
