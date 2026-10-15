import { AutoIncrementID } from '../../common/types/common.type';
import { ApiAuth } from '../../decorators/http.decorators';
import { CheckPolicies } from '../../decorators/policies.decorator';
import { AdminAuthGuard } from '../../guards/admin-auth.guard';
import { PoliciesGuard } from '../../guards/policies.guard';
import { AppAbility } from '../../shared/casl/ability.factory';
import { AppActions, AppSubjects } from '../../utils/permissions.constant';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import {
  FilterOperator,
  Paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { AuditLogService } from './audit-log.service';
import { AuditLogResDto } from './dto/audit-log.res.dto';

@ApiTags('Audit & Activity Logs')
@Controller({ path: ['audit-logs', 'activity-logs'], version: '1' })
@UseGuards(AdminAuthGuard, PoliciesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiAuth({
    type: AuditLogResDto,
    statusCode: 200,
    summary: 'Get paginated audit and activity logs',
    isPaginated: true,
    paginateOptions: {
      sortableColumns: [
        'id',
        'createdAt',
        'logName',
        'event',
        'subjectType',
        'causerType',
      ],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        createdAt: [FilterOperator.GTE, FilterOperator.LTE],
        event: [FilterOperator.IN, FilterOperator.EQ],
        logName: [FilterOperator.IN, FilterOperator.EQ],
        subjectType: [FilterOperator.ILIKE, FilterOperator.EQ],
        subjectId: [FilterOperator.EQ],
        causerType: [FilterOperator.ILIKE, FilterOperator.EQ],
        causerId: [FilterOperator.EQ],
        batchUuid: [FilterOperator.EQ],
        description: [FilterOperator.ILIKE],
      },
    },
  })
  @CheckPolicies((ability: AppAbility) =>
    ability.can(AppActions.Read, AppSubjects.Log),
  )
  findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<AuditLogResDto>> {
    return this.auditLogService.findAll(query);
  }

  @Get(':id')
  @ApiAuth({ type: AuditLogResDto, summary: 'Find audit log by id' })
  @ApiParam({ name: 'id', type: 'String' })
  @CheckPolicies((ability: AppAbility) =>
    ability.can(AppActions.Read, AppSubjects.Log),
  )
  async findOne(@Param('id') id: AutoIncrementID): Promise<AuditLogResDto> {
    return await this.auditLogService.findOne(id);
  }
}
