import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseUploadSessionIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (
      !value ||
      typeof value !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(value)
    ) {
      throw new BadRequestException('Invalid upload session id');
    }
    return value;
  }
}
