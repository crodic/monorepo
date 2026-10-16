import { AutoIncrementID } from '../../../common/types/common.type';

export type JwtPayloadType = {
  id: AutoIncrementID;
  sessionId: AutoIncrementID;
  hash: string;
  iat?: number;
  exp?: number;
};
