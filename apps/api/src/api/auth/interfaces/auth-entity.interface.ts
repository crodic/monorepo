import { AutoIncrementID } from '../../../common/types/common.type';
import { EAccountProvider } from '../../../common/constants/entity.enum';

export interface IAuthUser {
  id: AutoIncrementID;
  email: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  password?: string;
  avatar?: string;
  deletedAt?: Date | null;
  verifiedAt?: Date | null;
  notifications?: Record<string, boolean>;
}

export interface IAuthAccount {
  id: AutoIncrementID;
  provider: EAccountProvider;
  providerAccountId: string;
  password?: string;
}

export interface IAuthSession {
  id: AutoIncrementID;
  userId: AutoIncrementID;
  hash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
