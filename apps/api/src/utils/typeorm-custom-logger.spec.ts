import { Logger } from '@nestjs/common';
import { TypeOrmCustomLogger } from './typeorm-custom-logger';

describe('TypeOrmCustomLogger', () => {
  let logger: TypeOrmCustomLogger;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    logger = new TypeOrmCustomLogger(mockLogger, 'all');
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should log queries and parameters', () => {
    logger.logQuery('SELECT * FROM users WHERE id = $1', [1]);
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'query: SELECT * FROM users WHERE id = $1 -- PARAMETERS: [1]',
      ),
    );
  });

  it('should log query errors', () => {
    logger.logQueryError('error message', 'SELECT * FROM invalid_table', []);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('query failed: SELECT * FROM invalid_table'),
    );
    expect(mockLogger.error).toHaveBeenCalledWith('error:', 'error message');
  });

  it('should log slow queries', () => {
    logger.logQuerySlow(1500, 'SELECT pg_sleep(1.5)', []);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('query is slow: SELECT pg_sleep(1.5)'),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith('execution time: 1500');
  });

  it('should log schema build and migrations', () => {
    logger.logSchemaBuild('building schema...');
    expect(mockLogger.log).toHaveBeenCalledWith('building schema...');

    logger.logMigration('migrating...');
    expect(mockLogger.log).toHaveBeenCalledWith('migrating...');
  });

  it('should create instance via static getInstance', () => {
    const instance = TypeOrmCustomLogger.getInstance('test', ['error', 'warn']);
    expect(instance).toBeDefined();
  });
});
