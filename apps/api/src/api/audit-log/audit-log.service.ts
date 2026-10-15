import { AutoIncrementID } from '../../common/types/common.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import assert from 'assert';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { LessThan, Repository } from 'typeorm';
import { AuditLogResDto } from './dto/audit-log.res.dto';
import { ActivityLogEntity } from './entities/activity-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(ActivityLogEntity)
    private readonly auditLogRepository: Repository<ActivityLogEntity>,
  ) {}

  async findAll(query: PaginateQuery): Promise<Paginated<AuditLogResDto>> {
    const qb = this.auditLogRepository.createQueryBuilder('log');

    const result = await paginate(query, qb, {
      sortableColumns: [
        'id',
        'createdAt',
        'logName',
        'event',
        'subjectType',
        'causerType',
      ],
      searchableColumns: [
        'description',
        'subjectType',
        'subjectId',
        'causerId',
        'logName',
        'event',
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
    });

    return {
      ...result,
      data: plainToInstance(AuditLogResDto, result.data, {
        excludeExtraneousValues: true,
      }),
    } as Paginated<AuditLogResDto>;
  }

  async findOne(id: AutoIncrementID): Promise<AuditLogResDto> {
    assert(id, 'id is required');

    const auditLog = await this.auditLogRepository.findOneBy({ id });

    if (!auditLog) {
      throw new NotFoundException('Activity log not found');
    }

    return plainToInstance(AuditLogResDto, auditLog, {
      excludeExtraneousValues: true,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async purgeAuditLogsOlderThan7Days() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await this.auditLogRepository.delete({ createdAt: LessThan(sevenDaysAgo) });
  }
}
