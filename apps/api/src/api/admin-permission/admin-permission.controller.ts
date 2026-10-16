import { AutoIncrementID } from '../../common/types/common.type';
import { ApiAuth } from '../../decorators/http.decorators';
import { CheckAnyPolicies } from '../../decorators/policies.decorator';
import { AdminAuthGuard } from '../../guards/admin-auth.guard';
import { PoliciesGuard } from '../../guards/policies.guard';
import { AppAbility } from '../../shared/casl/ability.factory';
import { AppActions, AppSubjects } from '../../utils/permissions.constant';
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import {
  FilterOperator,
  Paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { AdminPermissionResDto } from './dto/admin-permission.res.dto';
import { UpdatePermissionReqDto } from './dto/update-permission.req.dto';
import { AdminPermissionService } from './admin-permission.service';

@ApiTags('Admin Permissions')
@Controller({ path: 'admin/permissions', version: '1' })
@UseGuards(AdminAuthGuard, PoliciesGuard)
export class AdminPermissionController {
  constructor(private readonly permissionService: AdminPermissionService) {}

  @Get()
  @ApiAuth({
    type: AdminPermissionResDto,
    summary: 'Get paginated list of admin permissions',
    isPaginated: true,
    paginateOptions: {
      sortableColumns: ['id', 'key', 'name', 'group', 'createdAt', 'updatedAt'],
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        key: [FilterOperator.ILIKE],
        name: [FilterOperator.ILIKE],
        group: [FilterOperator.ILIKE],
      },
    },
  })
  @CheckAnyPolicies(
    (ability: AppAbility) => ability.can(AppActions.Read, AppSubjects.Role),
    (ability: AppAbility) => ability.can(AppActions.Update, AppSubjects.Role),
  )
  findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<AdminPermissionResDto>> {
    return this.permissionService.findAll(query);
  }

  @Get('form-options')
  @ApiAuth({
    type: AdminPermissionResDto,
    summary: 'List all admin permissions',
  })
  @CheckAnyPolicies(
    (ability: AppAbility) => ability.can(AppActions.Read, AppSubjects.Role),
    (ability: AppAbility) => ability.can(AppActions.Create, AppSubjects.Role),
    (ability: AppAbility) => ability.can(AppActions.Update, AppSubjects.Role),
  )
  formOptions(): Promise<AdminPermissionResDto[]> {
    return this.permissionService.formOptions();
  }

  @Get(':id')
  @ApiAuth({
    type: AdminPermissionResDto,
    summary: 'Find admin permission by id',
  })
  @ApiParam({ name: 'id', type: 'String' })
  @CheckAnyPolicies(
    (ability: AppAbility) => ability.can(AppActions.Read, AppSubjects.Role),
    (ability: AppAbility) => ability.can(AppActions.Update, AppSubjects.Role),
  )
  findOne(@Param('id') id: AutoIncrementID): Promise<AdminPermissionResDto> {
    return this.permissionService.findOne(id);
  }

  @Put(':id')
  @ApiAuth({
    type: AdminPermissionResDto,
    summary: 'Update admin permission metadata',
  })
  @ApiParam({ name: 'id', type: 'String' })
  @CheckAnyPolicies((ability: AppAbility) =>
    ability.can(AppActions.Update, AppSubjects.Role),
  )
  update(
    @Param('id') id: AutoIncrementID,
    @Body() dto: UpdatePermissionReqDto,
  ): Promise<AdminPermissionResDto> {
    return this.permissionService.update(id, dto);
  }
}
