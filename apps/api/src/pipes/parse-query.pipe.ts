import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import qs from 'qs';

@Injectable()
export class ParseQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'query') {
      if (typeof value === 'string') {
        return qs.parse(value);
      }
      if (value && typeof value === 'object') {
        return qs.parse(qs.stringify(value));
      }
      return value;
    }
    return value;
  }
}
