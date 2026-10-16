import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC } from '../common/constants/app.constant';

export const Public = () => SetMetadata(IS_PUBLIC, true);
