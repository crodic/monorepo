import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CmsPageSeedService } from '../../database/seeds/cms-page/cms-page-seed.service';
import { LocationSeedService } from '../../database/seeds/location/location-seed.service';
import { SettingSeedService } from '../../database/seeds/setting/setting-seed.service';
import { WhiteLabelSeedService } from '../../database/seeds/white-label/white-label-seed.service';
import { AdminRoleService } from '../admin-role/admin-role.service';
import { AdminUserService } from '../admin-user/admin-user.service';
import { WhiteLabelService } from '../white-label/white-label.service';
import { HomeService } from './home.service';

describe('HomeService', () => {
  let service: HomeService;
  let adminUserService: jest.Mocked<Partial<AdminUserService>>;
  let adminRoleService: jest.Mocked<Partial<AdminRoleService>>;
  let whiteLabelService: jest.Mocked<Partial<WhiteLabelService>>;
  let settingSeedService: jest.Mocked<Partial<SettingSeedService>>;
  let whiteLabelSeedService: jest.Mocked<Partial<WhiteLabelSeedService>>;
  let cmsPageSeedService: jest.Mocked<Partial<CmsPageSeedService>>;
  let locationSeedService: jest.Mocked<Partial<LocationSeedService>>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    adminUserService = {
      hasAdmin: jest.fn(),
      createWithManager: jest.fn(),
    };
    adminRoleService = {
      hasRole: jest.fn(),
      createWithManager: jest.fn(),
    };
    whiteLabelService = {
      applySetupTheme: jest.fn(),
    };
    settingSeedService = {
      run: jest.fn().mockResolvedValue(undefined),
    };
    whiteLabelSeedService = {
      run: jest.fn().mockResolvedValue(undefined),
    };
    cmsPageSeedService = {
      run: jest.fn().mockResolvedValue(undefined),
    };
    locationSeedService = {
      run: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: AdminUserService,
          useValue: adminUserService,
        },
        {
          provide: AdminRoleService,
          useValue: adminRoleService,
        },
        {
          provide: WhiteLabelService,
          useValue: whiteLabelService,
        },
        {
          provide: SettingSeedService,
          useValue: settingSeedService,
        },
        {
          provide: WhiteLabelSeedService,
          useValue: whiteLabelSeedService,
        },
        {
          provide: CmsPageSeedService,
          useValue: cmsPageSeedService,
        },
        {
          provide: LocationSeedService,
          useValue: locationSeedService,
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialStatus', () => {
    it('should return initialized: false when no admin and no role', async () => {
      (adminUserService.hasAdmin as jest.Mock).mockResolvedValue(false);
      (adminRoleService.hasRole as jest.Mock).mockResolvedValue(false);

      const result = await service.initialStatus();
      expect(result).toEqual({
        initialized: false,
        message: 'System has not been initialized',
      });
    });

    it('should return initialized: true when both admin and role exist', async () => {
      (adminUserService.hasAdmin as jest.Mock).mockResolvedValue(true);
      (adminRoleService.hasRole as jest.Mock).mockResolvedValue(true);

      const result = await service.initialStatus();
      expect(result).toEqual({
        initialized: true,
        message: 'System has been initialized',
      });
    });
  });

  describe('systemSetup', () => {
    it('should throw FORBIDDEN if system has already been initialized', async () => {
      (adminUserService.hasAdmin as jest.Mock).mockResolvedValue(true);
      (adminRoleService.hasRole as jest.Mock).mockResolvedValue(false);

      await expect(
        service.systemSetup({
          email: 'admin@test.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should initialize system successfully', async () => {
      (adminUserService.hasAdmin as jest.Mock).mockResolvedValue(false);
      (adminRoleService.hasRole as jest.Mock).mockResolvedValue(false);

      const mockRepo = {
        findBy: jest.fn().mockResolvedValue([]),
        save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
        create: jest.fn().mockImplementation((val) => val),
        update: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue({ id: 'perm-id' }),
      };
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockRepo),
      };
      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));
      (adminRoleService.createWithManager as jest.Mock).mockResolvedValue({
        id: 'role-id',
      });
      (adminUserService.createWithManager as jest.Mock).mockResolvedValue({
        id: 'user-id',
      });

      const result = await service.systemSetup({
        email: 'admin@test.com',
        password: 'Password123!',
        site_brand: 'My Platform',
      });

      expect(result).toEqual({
        success: true,
        message: 'System initialized successfully',
      });
      expect(settingSeedService.run).toHaveBeenCalledWith('My Platform');
      expect(whiteLabelSeedService.run).toHaveBeenCalledWith('My Platform');
      expect(whiteLabelService.applySetupTheme).toHaveBeenCalled();
      expect(cmsPageSeedService.run).toHaveBeenCalled();
      expect(locationSeedService.run).toHaveBeenCalled();
    });
  });
});
