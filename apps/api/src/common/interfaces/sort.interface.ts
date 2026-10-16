import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export type SortDirection = 'asc' | 'desc';

export interface QuerySort<T extends ObjectLiteral = any> {
  key: string;
  apply(qb: SelectQueryBuilder<T>, direction: SortDirection): void;
}
