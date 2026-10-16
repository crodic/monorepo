import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface QueryFilter<T extends ObjectLiteral = any, V = any> {
  key: string;
  apply(qb: SelectQueryBuilder<T>, value: V): void;
}
