import { SetMetadata } from '@nestjs/common';
import { SKIP_POLICIES } from '../common/constants/app.constant';

export const SkipPolicies = () => SetMetadata(SKIP_POLICIES, true);
