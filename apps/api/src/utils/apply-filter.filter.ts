import { QueryFilter } from '../common/interfaces/filter.interface';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function applyFilters<TEntity extends ObjectLiteral>(
  qb: SelectQueryBuilder<TEntity>,
  filters: Record<string, any> = {},
  availableFilters: QueryFilter<TEntity>[],
) {
  const map = new Map(availableFilters.map((f) => [f.key, f]));

  Object.entries(filters).forEach(([key, value]) => {
    const filter = map.get(key);
    if (!filter) return;

    filter.apply(qb, value);
  });

  return qb;
}
