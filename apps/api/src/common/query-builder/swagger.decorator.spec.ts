import { Controller, Get } from '@nestjs/common';
import { ApiQueryBuilderDocs } from './swagger.decorator';
import { AllowedFilter } from './allowed-filter';
import { AllowedSort } from './allowed-sort';
import { AllowedInclude } from './allowed-include';
import { ApiAuth, ApiPublic } from '../../decorators/http.decorators';

class TestDto {
  id!: string;
  name!: string;
}

enum StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

describe('ApiQueryBuilderDocs Decorator', () => {
  it('should apply without errors on a controller method with full configuration', () => {
    class SampleController {
      @Get()
      @ApiQueryBuilderDocs({
        entity: TestDto,
        filters: [
          'name',
          AllowedFilter.exact('status'),
          AllowedFilter.trashed(),
          {
            name: 'role',
            enum: StatusEnum,
            description: 'Filter by role',
          },
        ],
        sorts: ['createdAt', 'name', AllowedSort.field('role', 'roles.name')],
        defaultSort: '-createdAt',
        includes: ['roles', 'profile', AllowedInclude.count('comments')],
        fields: ['id', 'name', 'email'],
        defaultLimit: 15,
        maxLimit: 50,
      })
      findAll() {
        return [];
      }
    }

    const controller = new SampleController();
    expect(controller).toBeDefined();
    expect(typeof controller.findAll).toBe('function');
  });

  it('should integrate seamlessly into ApiPublic with isQueryBuilder: true', () => {
    @Controller('public-test')
    class PublicSampleController {
      @Get()
      @ApiPublic({
        type: TestDto,
        isQueryBuilder: true,
        summary: 'Public list with query builder',
        queryBuilderOptions: {
          filters: ['name'],
          sorts: ['createdAt'],
        },
      })
      findAll() {
        return [];
      }
    }

    const controller = new PublicSampleController();
    expect(controller).toBeDefined();
  });

  it('should integrate seamlessly into ApiAuth with isQueryBuilder: true', () => {
    @Controller('auth-test')
    class AuthSampleController {
      @Get()
      @ApiAuth({
        type: TestDto,
        isQueryBuilder: true,
        summary: 'Protected list with query builder',
        queryBuilderOptions: {
          filters: [AllowedFilter.exact('status')],
          includes: ['roles'],
        },
      })
      findAll() {
        return [];
      }
    }

    const controller = new AuthSampleController();
    expect(controller).toBeDefined();
  });
});
