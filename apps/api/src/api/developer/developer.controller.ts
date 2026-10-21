import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../../decorators/http.decorators';
import { CheckPolicies } from '../../decorators/policies.decorator';
import { AdminAuthGuard } from '../../guards/admin-auth.guard';
import { PoliciesGuard } from '../../guards/policies.guard';
import { AppAbility } from '../../shared/casl/ability.factory';
import { AppActions, AppSubjects } from '../../utils/permissions.constant';
import { getOpenApiDocument } from '../../utils/setup-swagger';

@ApiTags('Developer Tools')
@Controller({ path: 'developer', version: '1' })
@UseGuards(AdminAuthGuard, PoliciesGuard)
export class DeveloperController {
  @Get('openapi-spec')
  @ApiAuth({
    statusCode: 200,
    summary:
      'Get OpenAPI Specification for Developer Tools & API Console (Super Admin only)',
  })
  @CheckPolicies((ability: AppAbility) =>
    ability.can(AppActions.Manage, AppSubjects.All),
  )
  getOpenApiSpec() {
    const doc = getOpenApiDocument();
    if (!doc) {
      throw new NotFoundException('OpenAPI specification is not available');
    }
    return doc;
  }
}
