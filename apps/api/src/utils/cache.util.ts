import { CacheKey } from '../common/constants/cache.constant';
import util from 'util';

export const createCacheKey = (
  key: CacheKey,
  ...args: (string | number)[]
): string => {
  return util.format(key, ...args);
};
