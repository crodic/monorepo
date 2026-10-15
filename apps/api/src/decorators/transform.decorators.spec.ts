import { plainToInstance } from 'class-transformer';
import {
  ToBoolean,
  ToFullUrl,
  ToLowerCase,
  ToUpperCase,
  Trim,
} from './transform.decorators';

class TestTransformDto {
  @Trim()
  trimmed?: string;

  @ToBoolean()
  booleanValue?: boolean;

  @ToLowerCase()
  lower?: string;

  @ToUpperCase()
  upper?: string;

  @ToFullUrl()
  url?: string;
}

describe('Transform Decorators', () => {
  it('should trim string values', () => {
    const result = plainToInstance(TestTransformDto, {
      trimmed: '  hello world  ',
    });
    expect(result.trimmed).toBe('hello world');
  });

  it('should trim string array values', () => {
    class TestArrayDto {
      @Trim()
      items?: string[];
    }
    const result = plainToInstance(TestArrayDto, {
      items: [' foo ', '  bar  '],
    });
    expect(result.items).toEqual(['foo', 'bar']);
  });

  it('should correctly convert to boolean', () => {
    expect(
      plainToInstance(TestTransformDto, { booleanValue: 'true' }).booleanValue,
    ).toBe(true);
    expect(
      plainToInstance(TestTransformDto, { booleanValue: '1' }).booleanValue,
    ).toBe(true);
    expect(
      plainToInstance(TestTransformDto, { booleanValue: 1 }).booleanValue,
    ).toBe(true);
    expect(
      plainToInstance(TestTransformDto, { booleanValue: true }).booleanValue,
    ).toBe(true);

    expect(
      plainToInstance(TestTransformDto, { booleanValue: 'false' }).booleanValue,
    ).toBe(false);
    expect(
      plainToInstance(TestTransformDto, { booleanValue: '0' }).booleanValue,
    ).toBe(false);
    expect(
      plainToInstance(TestTransformDto, { booleanValue: 0 }).booleanValue,
    ).toBe(false);
    expect(
      plainToInstance(TestTransformDto, { booleanValue: false }).booleanValue,
    ).toBe(false);
    expect(
      plainToInstance(TestTransformDto, { booleanValue: 'random' })
        .booleanValue,
    ).toBe('random');
  });

  it('should transform to lowercase', () => {
    const result = plainToInstance(TestTransformDto, {
      lower: 'HELLO WORLD',
    });
    expect(result.lower).toBe('hello world');
  });

  it('should transform to uppercase', () => {
    const result = plainToInstance(TestTransformDto, {
      upper: 'hello world',
    });
    expect(result.upper).toBe('HELLO WORLD');
  });

  it('should prefix full URL if relative path', () => {
    const result = plainToInstance(TestTransformDto, {
      url: '/uploads/image.png',
    });
    expect(result.url).toMatch(/\/uploads\/image\.png$/);
  });

  it('should keep already absolute URL', () => {
    const result = plainToInstance(TestTransformDto, {
      url: 'https://example.com/image.png',
    });
    expect(result.url).toBe('https://example.com/image.png');
  });
});
