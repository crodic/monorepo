import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsPageSeedModule } from '../../database/seeds/cms-page/cms-page-seed.module';
import { LocationSeedModule } from '../../database/seeds/location/location-seed.module';
import { SettingSeedModule } from '../../database/seeds/setting/setting-seed.module';
import { WhiteLabelSeedModule } from '../../database/seeds/white-label/white-label-seed.module';
import { AdminPermissionEntity } from '../admin-permission/entities/admin-permission.entity';
import { AdminRoleModule } from '../admin-role/admin-role.module';
import { AdminUserModule } from '../admin-user/admin-user.module';
import { SettingsModule } from '../settings/settings.module';
import { WhiteLabelModule } from '../white-label/white-label.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { SetupController } from './setup.controller';

@Module({
  imports: [
    AdminUserModule,
    AdminRoleModule,
    SettingsModule,
    WhiteLabelModule,
    SettingSeedModule,
    WhiteLabelSeedModule,
    CmsPageSeedModule,
    LocationSeedModule,
    TypeOrmModule.forFeature([AdminPermissionEntity]),
  ],
  controllers: [HomeController, SetupController],
  providers: [HomeService],
})
export class HomeModule {}
