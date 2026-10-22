import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class BulkFileActionDto {
  @ApiProperty({
    description: 'Array of file public IDs',
    example: ['files/1771203054787_abc123.jpg'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  public_ids: string[];
}
