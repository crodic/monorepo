import { Expose, Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  FILE_FOLDER_NAME_MESSAGE,
  FILE_FOLDER_NAME_PATTERN,
} from '../utils/folder-name.util';

export class FileFolderResDto {
  @Expose()
  @IsString()
  folder: string;

  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  parent?: string | null;

  @Expose()
  @IsOptional()
  @IsNumber()
  depth?: number;

  @Expose()
  @IsNumber()
  count: number;

  @Expose()
  @IsNumber()
  size: number;

  @Expose()
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateFolderDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  @Matches(FILE_FOLDER_NAME_PATTERN, { message: FILE_FOLDER_NAME_MESSAGE })
  folder: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}

export class RenameFolderDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  @Matches(FILE_FOLDER_NAME_PATTERN, { message: FILE_FOLDER_NAME_MESSAGE })
  folder: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}

export class DeleteFolderDto {
  @IsOptional()
  @IsString()
  folder?: string;
}
