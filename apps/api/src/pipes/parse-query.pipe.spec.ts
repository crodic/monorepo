import { ArgumentMetadata } from '@nestjs/common';
import { ParseQueryPipe } from './parse-query.pipe';

describe('ParseQueryPipe', () => {
  let pipe: ParseQueryPipe;

  beforeEach(() => {
    pipe = new ParseQueryPipe();
  });

  it('should return value unchanged when metadata type is not query', () => {
    const metadata: ArgumentMetadata = { type: 'body' };
    const value = { name: 'test' };

    expect(pipe.transform(value, metadata)).toBe(value);
  });

  it('should parse nested query parameters from a raw query string', () => {
    const metadata: ArgumentMetadata = { type: 'query' };
    const rawQuery = 'filter[name]=john&filter[status]=active&sort=-createdAt';

    const result = pipe.transform(rawQuery, metadata);

    expect(result).toEqual({
      filter: {
        name: 'john',
        status: 'active',
      },
      sort: '-createdAt',
    });
  });

  it('should parse bracket notation keys from a shallow object', () => {
    const metadata: ArgumentMetadata = { type: 'query' };
    const queryObj = {
      'filter[email]': 'user@example.com',
      'fields[users]': 'id,email',
      include: 'posts',
    };

    const result = pipe.transform(queryObj, metadata);

    expect(result).toEqual({
      filter: {
        email: 'user@example.com',
      },
      fields: {
        users: 'id,email',
      },
      include: 'posts',
    });
  });

  it('should return undefined when value is undefined', () => {
    const metadata: ArgumentMetadata = { type: 'query' };
    expect(pipe.transform(undefined, metadata)).toBeUndefined();
  });

  it('should return null when value is null', () => {
    const metadata: ArgumentMetadata = { type: 'query' };
    expect(pipe.transform(null, metadata)).toBeNull();
  });

  it('should parse empty string into empty object', () => {
    const metadata: ArgumentMetadata = { type: 'query' };
    expect(pipe.transform('', metadata)).toEqual({});
  });
});
