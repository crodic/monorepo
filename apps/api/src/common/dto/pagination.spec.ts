import { PageOptionsDto as OffsetPageOptionsDto } from './offset-pagination/page-options.dto';
import { OffsetPaginationDto } from './offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from './offset-pagination/paginated.dto';
import { PageOptionsDto as CursorPageOptionsDto } from './cursor-pagination/page-options.dto';
import { CursorPaginationDto } from './cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from './cursor-pagination/paginated.dto';

describe('Pagination DTOs', () => {
  describe('Offset Pagination', () => {
    it('should correctly calculate offset from page and limit', () => {
      const pageOptions = new OffsetPageOptionsDto();
      // default: page 1, limit 10 -> offset 0
      expect(pageOptions.offset).toBe(0);

      const customOptions = Object.assign(new OffsetPageOptionsDto(), {
        page: 3,
        limit: 20,
      });
      expect(customOptions.offset).toBe(40);
    });

    it('should correctly compute totalPages, nextPage, and previousPage', () => {
      const pageOptions = Object.assign(new OffsetPageOptionsDto(), {
        page: 2,
        limit: 10,
      });
      const meta = new OffsetPaginationDto(35, pageOptions);

      expect(meta.totalRecords).toBe(35);
      expect(meta.totalPages).toBe(4);
      expect(meta.currentPage).toBe(2);
      expect(meta.nextPage).toBe(3);
      expect(meta.previousPage).toBe(1);
    });

    it('should return undefined for nextPage on last page', () => {
      const pageOptions = Object.assign(new OffsetPageOptionsDto(), {
        page: 4,
        limit: 10,
      });
      const meta = new OffsetPaginationDto(35, pageOptions);

      expect(meta.totalPages).toBe(4);
      expect(meta.nextPage).toBeUndefined();
      expect(meta.previousPage).toBe(3);
    });

    it('should return undefined for previousPage on first page', () => {
      const pageOptions = Object.assign(new OffsetPageOptionsDto(), {
        page: 1,
        limit: 10,
      });
      const meta = new OffsetPaginationDto(35, pageOptions);

      expect(meta.previousPage).toBeUndefined();
      expect(meta.nextPage).toBe(2);
    });

    it('should wrap in OffsetPaginatedDto with meta, links, and pagination getter', () => {
      const pageOptions = new OffsetPageOptionsDto();
      const meta = new OffsetPaginationDto(1, pageOptions);
      const paginated = new OffsetPaginatedDto([{ id: 1 }], meta);

      expect(paginated.data).toHaveLength(1);
      expect(paginated.meta.totalItems).toBe(1);
      expect(paginated.meta.itemsPerPage).toBe(10);
      expect(paginated.pagination.totalRecords).toBe(1);
      expect(paginated.pagination.currentPage).toBe(1);
    });
  });

  describe('Cursor Pagination', () => {
    it('should construct CursorPaginationDto', () => {
      const pageOptions = Object.assign(new CursorPageOptionsDto(), {
        limit: 15,
      });
      const meta = new CursorPaginationDto(
        50,
        'after_token',
        'before_token',
        pageOptions,
      );

      expect(meta.limit).toBe(15);
      expect(meta.afterCursor).toBe('after_token');
      expect(meta.beforeCursor).toBe('before_token');
      expect(meta.totalRecords).toBe(50);
    });

    it('should wrap in CursorPaginatedDto', () => {
      const pageOptions = new CursorPageOptionsDto();
      const meta = new CursorPaginationDto(10, 'cur1', undefined, pageOptions);
      const paginated = new CursorPaginatedDto([{ id: 1 }], meta);

      expect(paginated.data).toHaveLength(1);
      expect(paginated.pagination.afterCursor).toBe('cur1');
      expect(paginated.pagination.beforeCursor).toBeUndefined();
    });
  });
});
