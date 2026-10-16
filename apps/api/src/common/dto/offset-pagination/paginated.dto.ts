import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PaginatedLinks {
  @ApiProperty({ required: false, nullable: true })
  @Expose()
  first?: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  previous?: string;

  @ApiProperty()
  @Expose()
  current: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  next?: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  last?: string;
}

export class PaginatedMeta<T = any> {
  @ApiProperty({ example: 10 })
  @Expose()
  itemsPerPage: number;

  @ApiProperty({ example: 100 })
  @Expose()
  totalItems: number;

  @ApiProperty({ example: 1 })
  @Expose()
  currentPage: number;

  @ApiProperty({ example: 10 })
  @Expose()
  totalPages: number;

  @ApiProperty({
    example: [['id', 'DESC']],
    type: 'array',
    items: { type: 'array', items: { type: 'string' } },
  })
  @Expose()
  sortBy: [string, 'ASC' | 'DESC'][];

  @ApiProperty({ required: false })
  @Expose()
  search?: string;

  @ApiProperty({ required: false, type: [String] })
  @Expose()
  searchBy?: string[];

  @ApiProperty({ required: false, type: [String] })
  @Expose()
  select?: string[];

  @ApiProperty({ required: false })
  @Expose()
  filter?: Record<string, string | string[]>;
}

export class Paginated<TData> {
  @ApiProperty({ type: [Object] })
  @Expose()
  data: TData[];

  @ApiProperty({ type: () => PaginatedMeta })
  @Expose()
  meta: PaginatedMeta<TData>;

  @ApiProperty({ type: () => PaginatedLinks })
  @Expose()
  links: PaginatedLinks;

  constructor(
    data: TData[],
    meta: PaginatedMeta<TData> | any,
    links: PaginatedLinks = { current: '' },
  ) {
    this.data = data;
    if (meta && 'itemsPerPage' in meta) {
      this.meta = meta;
    } else if (meta && 'limit' in meta) {
      // Compatibility adapter for legacy OffsetPaginationDto
      this.meta = {
        itemsPerPage: meta.limit,
        totalItems: meta.totalRecords,
        currentPage: meta.currentPage,
        totalPages: meta.totalPages,
        sortBy: [],
      };
    } else {
      this.meta = {
        itemsPerPage: 10,
        totalItems: 0,
        currentPage: 1,
        totalPages: 0,
        sortBy: [],
      };
    }
    this.links = links;
  }

  @ApiProperty({ required: false })
  @Expose()
  get pagination() {
    return {
      limit: this.meta?.itemsPerPage ?? 10,
      currentPage: this.meta?.currentPage ?? 1,
      totalRecords: this.meta?.totalItems ?? 0,
      totalPages: this.meta?.totalPages ?? 0,
      nextPage:
        this.meta && this.meta.currentPage < this.meta.totalPages
          ? this.meta.currentPage + 1
          : undefined,
      previousPage:
        this.meta && this.meta.currentPage > 1
          ? this.meta.currentPage - 1
          : undefined,
    };
  }
}

export { Paginated as OffsetPaginatedDto };
