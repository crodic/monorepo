import { AutoIncrementID } from '../../../common/types/common.type';

export type JwtForgotPasswordPayloadType = {
  id: AutoIncrementID;
  iat?: number;
  exp?: number;
};
