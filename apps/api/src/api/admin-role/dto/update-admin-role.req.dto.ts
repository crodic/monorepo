import { PartialType } from '@nestjs/swagger';
import { CreateAdminRoleReqDto } from './create-admin-role.req.dto';

export class UpdateAdminRoleReqDto extends PartialType(CreateAdminRoleReqDto) {}
