import { REQUIRE_VERIFIED_EMAIL } from '../common/constants/app.constant';
import { SetMetadata } from '@nestjs/common';

export const RequireVerifiedEmail = () =>
  SetMetadata(REQUIRE_VERIFIED_EMAIL, true);
