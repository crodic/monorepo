import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { Repository } from 'typeorm';
import { ActivityLogEntity } from './entities/activity-log.entity';

export class ActivityBuilder {
  private _logName = 'default';
  private _event?: string | null;
  private _subjectType?: string | null;
  private _subjectId?: any;
  private _causerType?: string | null;
  private _causerId?: string | null;
  private _batchUuid?: string | null;
  private _properties: Record<string, any> = {};

  constructor(
    private readonly repo: Repository<ActivityLogEntity>,
    private readonly cls: ClsService,
  ) {
    const user = this.cls.get('user');
    const userType = this.cls.get('userType');
    if (user?.id) {
      this._causerId = String(user.id);
      this._causerType = userType || 'AdminUserEntity';
    }
    const ip = this.cls.get('ip');
    if (ip) this._properties.ip = ip;
    const userAgent = this.cls.get('userAgent');
    if (userAgent) this._properties.userAgent = userAgent;
    const requestId = this.cls.get('requestId');
    if (requestId) this._properties.requestId = requestId;
    const batchUuid = this.cls.get('batchUuid');
    if (batchUuid) this._batchUuid = batchUuid;
  }

  useLog(logName: string): this {
    this._logName = logName;
    return this;
  }

  event(event: string): this {
    this._event = event;
    return this;
  }

  performedOn(subject: any): this {
    if (subject) {
      this._subjectType =
        subject.constructor?.name && subject.constructor.name !== 'Object'
          ? subject.constructor.name
          : subject.name || String(subject);
      this._subjectId = subject.id ?? null;
    }
    return this;
  }

  causedBy(causer: any): this {
    if (causer) {
      this._causerType =
        causer.constructor?.name && causer.constructor.name !== 'Object'
          ? causer.constructor.name
          : 'AdminUserEntity';
      this._causerId = causer.id ? String(causer.id) : null;
    }
    return this;
  }

  withBatch(batchUuid: string): this {
    this._batchUuid = batchUuid;
    return this;
  }

  withProperties(properties: Record<string, any>): this {
    this._properties = { ...this._properties, ...properties };
    return this;
  }

  async log(description: string): Promise<ActivityLogEntity> {
    const log = this.repo.create({
      logName: this._logName,
      description,
      subjectType: this._subjectType,
      subjectId: this._subjectId,
      causerType: this._causerType,
      causerId: this._causerId,
      event: this._event,
      batchUuid: this._batchUuid,
      properties:
        Object.keys(this._properties).length > 0 ? this._properties : undefined,
    });

    return await this.repo.save(log);
  }
}

@Injectable()
export class ActivityLoggerService {
  constructor(
    @InjectRepository(ActivityLogEntity)
    private readonly repo: Repository<ActivityLogEntity>,
    private readonly cls: ClsService,
  ) {}

  useLog(logName: string): ActivityBuilder {
    return new ActivityBuilder(this.repo, this.cls).useLog(logName);
  }

  event(event: string): ActivityBuilder {
    return new ActivityBuilder(this.repo, this.cls).event(event);
  }

  performedOn(subject: any): ActivityBuilder {
    return new ActivityBuilder(this.repo, this.cls).performedOn(subject);
  }

  causedBy(causer: any): ActivityBuilder {
    return new ActivityBuilder(this.repo, this.cls).causedBy(causer);
  }

  withBatch(batchUuid: string): ActivityBuilder {
    return new ActivityBuilder(this.repo, this.cls).withBatch(batchUuid);
  }

  withProperties(properties: Record<string, any>): ActivityBuilder {
    return new ActivityBuilder(this.repo, this.cls).withProperties(properties);
  }

  async log(description: string): Promise<ActivityLogEntity> {
    return new ActivityBuilder(this.repo, this.cls).log(description);
  }
}
