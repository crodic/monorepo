import { BadRequestException } from '@nestjs/common';

export class InvalidQueryException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidFilterQueryException extends InvalidQueryException {
  constructor(invalidFilters: string[], allowedFilters: string[]) {
    const invalidList = invalidFilters.map((f) => `'${f}'`).join(', ');
    const allowedList = allowedFilters.map((f) => `'${f}'`).join(', ');
    super(
      `Requested filter(s) [${invalidList}] are not allowed. Allowed filter(s) are: [${allowedList}].`,
    );
  }
}

export class InvalidSortQueryException extends InvalidQueryException {
  constructor(invalidSorts: string[], allowedSorts: string[]) {
    const invalidList = invalidSorts.map((s) => `'${s}'`).join(', ');
    const allowedList = allowedSorts.map((s) => `'${s}'`).join(', ');
    super(
      `Requested sort(s) [${invalidList}] are not allowed. Allowed sort(s) are: [${allowedList}].`,
    );
  }
}

export class InvalidIncludeQueryException extends InvalidQueryException {
  constructor(invalidIncludes: string[], allowedIncludes: string[]) {
    const invalidList = invalidIncludes.map((i) => `'${i}'`).join(', ');
    const allowedList = allowedIncludes.map((i) => `'${i}'`).join(', ');
    super(
      `Requested include(s) [${invalidList}] are not allowed. Allowed include(s) are: [${allowedList}].`,
    );
  }
}

export class InvalidFieldQueryException extends InvalidQueryException {
  constructor(invalidFields: string[], allowedFields: string[]) {
    const invalidList = invalidFields.map((f) => `'${f}'`).join(', ');
    const allowedList = allowedFields.map((f) => `'${f}'`).join(', ');
    super(
      `Requested field(s) [${invalidList}] are not allowed. Allowed field(s) are: [${allowedList}].`,
    );
  }
}
