import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  const mockPermissionRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => new PermissionEntity(data)),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(PermissionEntity),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('returns permission when found', async () => {
      const permission = new PermissionEntity({
        id: '1' as any,
        name: 'View users',
        group: 'User Management',
        key: 'read:USER',
      });
      mockPermissionRepository.findOneOrFail.mockResolvedValue(permission);

      const result = await service.findOne('1' as any);
      expect(result.id).toBe('1');
      expect(result.key).toBe('read:USER');
    });
  });

  describe('update', () => {
    it('updates and returns permission', async () => {
      const permission = new PermissionEntity({
        id: '1' as any,
        name: 'View users',
        group: 'User Management',
        description: 'Old description',
        key: 'read:USER',
      });
      mockPermissionRepository.findOneOrFail.mockResolvedValue(permission);
      mockPermissionRepository.save.mockImplementation((p) =>
        Promise.resolve(p),
      );

      const result = await service.update('1' as any, {
        group: 'Updated Group',
        description: 'New description',
      });

      expect(mockPermissionRepository.save).toHaveBeenCalled();
      expect(result.group).toBe('Updated Group');
      expect(result.description).toBe('New description');
    });
  });
});
