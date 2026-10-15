import { Transform } from 'class-transformer';

/**
 * @description trim spaces from start and end, replace multiple spaces with one.
 *
 * @example
 * @ApiProperty()
 * @IsString()
 * @Trim()
 * name: string;
 *
 * @returns PropertyDecorator
 * @constructor
 */
export function Trim(): PropertyDecorator {
  return Transform((params) => {
    const value = params.value as string[] | string;

    if (Array.isArray(value)) {
      return value.map((v) =>
        typeof v === 'string' ? v.trim().replaceAll(/\s\s+/g, ' ') : v,
      );
    }

    if (typeof value === 'string') {
      return value.trim().replaceAll(/\s\s+/g, ' ');
    }

    return value;
  });
}

export function ToBoolean(): PropertyDecorator {
  return Transform(
    (params) => {
      switch (params.value) {
        case 'true':
        case true:
        case 1:
        case '1': {
          return true;
        }

        case 'false':
        case false:
        case 0:
        case '0': {
          return false;
        }

        default: {
          return params.value;
        }
      }
    },
    { toClassOnly: true },
  );
}

export function ToLowerCase(): PropertyDecorator {
  return Transform(
    (params) => {
      const value = params.value;

      if (!value) {
        return value;
      }

      if (!Array.isArray(value)) {
        return typeof value === 'string' ? value.toLowerCase() : value;
      }

      return value.map((v) => (typeof v === 'string' ? v.toLowerCase() : v));
    },
    {
      toClassOnly: true,
    },
  );
}

export function ToUpperCase(): PropertyDecorator {
  return Transform(
    (params) => {
      const value = params.value;

      if (!value) {
        return value;
      }

      if (!Array.isArray(value)) {
        return typeof value === 'string' ? value.toUpperCase() : value;
      }

      return value.map((v) => (typeof v === 'string' ? v.toUpperCase() : v));
    },
    {
      toClassOnly: true,
    },
  );
}

export function ToFullUrl(): PropertyDecorator {
  return Transform(({ value }) => {
    if (!value) return null;
    if (typeof value !== 'string') return value;

    if (value.startsWith('http://') || value.startsWith('https://'))
      return value;

    const baseUrl = process.env.APP_URL || '';

    const normalizedBase = baseUrl.endsWith('/')
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const normalizedPath = value.startsWith('/') ? value : `/${value}`;

    return `${normalizedBase}${normalizedPath}`;
  });
}
