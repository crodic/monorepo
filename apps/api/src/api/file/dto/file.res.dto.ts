import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class FileAdminUserSummaryDto {
  @ApiProperty({ example: '1' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ example: 'John' })
  @Expose()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @Expose()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'admin@example.com' })
  @Expose()
  @IsString()
  email: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @Expose()
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class FileResDto {
  @IsString()
  @Expose()
  id: string;

  @Expose()
  @IsString()
  public_id: string;

  @Expose()
  @IsString()
  folder?: string;

  @Expose()
  @IsString()
  disk?: string;

  @Expose()
  @IsString()
  visibility: 'public' | 'private';

  @Expose()
  @IsString()
  original_name: string;

  @Expose()
  @IsString()
  path: string;

  @Expose()
  @IsString()
  hash: string;

  @Expose()
  @IsString()
  mime: string;

  @Expose()
  @IsNumber()
  size: number;

  @Expose()
  @IsNumber()
  width?: number;

  @Expose()
  @IsNumber()
  height?: number;

  @Expose()
  @IsNumber()
  duration?: number;

  @Expose()
  @IsString()
  resource_type: string;

  @Expose()
  @IsString()
  status: string;

  @Expose()
  @IsBoolean()
  is_starred: boolean;

  @Expose()
  @IsString()
  url: string;

  @Expose()
  @IsString()
  createdAt: string;

  @Expose()
  @IsString()
  updatedAt: string;

  @ApiPropertyOptional({ example: '1', nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  createdByAdminId?: string | null;

  @ApiPropertyOptional({ type: () => FileAdminUserSummaryDto, nullable: true })
  @Expose()
  @Type(() => FileAdminUserSummaryDto)
  createdByAdmin?: FileAdminUserSummaryDto | null;

  @ApiPropertyOptional({ example: '1', nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  updatedByAdminId?: string | null;

  @ApiPropertyOptional({ type: () => FileAdminUserSummaryDto, nullable: true })
  @Expose()
  @Type(() => FileAdminUserSummaryDto)
  updatedByAdmin?: FileAdminUserSummaryDto | null;

  @ApiPropertyOptional({
    example: '2026-10-22T08:00:00.000Z',
    nullable: true,
  })
  @Expose()
  @IsOptional()
  @IsString()
  deletedAt?: string | null;
}
