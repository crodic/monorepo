import { AutoIncrementID } from '../../common/types/common.type';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Not, Repository } from 'typeorm';
import { AdminPermissionResDto } from './dto/admin-permission.res.dto';
import { UpdatePermissionReqDto } from './dto/update-permission.req.dto';
import { AdminPermissionEntity } from './entities/admin-permission.entity';
import { FULL_ACCESS_PERMISSION_KEY, syncPermissions } from './permission-sync';

@Injectable()
export class AdminPermissionService implements OnModuleInit {
  private isSynced = false;

  constructor(
    @InjectRepository(AdminPermissionEntity)
    private readonly permissionRepository: Repository<AdminPermissionEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSynced();
  }

  private async ensureSynced(): Promise<void> {
    if (this.isSynced) {
      return;
    }
    await syncPermissions(this.permissionRepository);
    this.isSynced = true;
  }

  async formOptions(): Promise<AdminPermissionResDto[]> {
    await this.ensureSynced();

    const permissions = await this.permissionRepository.find({
      where: {
        key: Not(FULL_ACCESS_PERMISSION_KEY),
      },
      order: {
        key: 'ASC',
      },
    });

    return plainToInstance(AdminPermissionResDto, permissions, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: PaginateQuery,
  ): Promise<Paginated<AdminPermissionResDto>> {
    await this.ensureSynced();

    const queryBuilder =
      this.permissionRepository.createQueryBuilder('permission');

    const result = await paginate(query, queryBuilder, {
      sortableColumns: ['id', 'key', 'name', 'group', 'createdAt', 'updatedAt'],
      searchableColumns: ['key', 'name', 'group', 'description'],
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        key: [FilterOperator.ILIKE],
        name: [FilterOperator.ILIKE],
        group: [FilterOperator.ILIKE],
      },
    });

    return {
      ...result,
      data: plainToInstance(AdminPermissionResDto, result.data, {
        excludeExtraneousValues: true,
      }),
    } as Paginated<AdminPermissionResDto>;
  }

  async findOne(id: AutoIncrementID): Promise<AdminPermissionResDto> {
    const permission = await this.permissionRepository.findOneOrFail({
      where: { id },
    });

    return plainToInstance(AdminPermissionResDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: AutoIncrementID,
    dto: UpdatePermissionReqDto,
  ): Promise<AdminPermissionResDto> {
    const permission = await this.permissionRepository.findOneOrFail({
      where: { id },
    });

    Object.assign(permission, {
      group: dto.group,
      description: dto.description,
    });

    const savedPermission = await this.permissionRepository.save(permission);

    return plainToInstance(AdminPermissionResDto, savedPermission, {
      excludeExtraneousValues: true,
    });
  }
}
