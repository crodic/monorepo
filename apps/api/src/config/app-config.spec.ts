import { Environment, LogService } from '../common/constants/app.constant';
import appConfig from './app.config';

describe('AppConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
  });

  describe('nodeEnv', () => {
    it('should return the value of NODE_ENV', async () => {
      process.env.NODE_ENV = Environment.DEVELOPMENT;
      const config = await appConfig();
      expect(config.nodeEnv).toBe(Environment.DEVELOPMENT);
    });

    it('should return development when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV;
      const config = await appConfig();
      expect(config.nodeEnv).toBe(Environment.DEVELOPMENT);
    });

    it('should throw an error when NODE_ENV is invalid', async () => {
      process.env.NODE_ENV = 'invalid-env';
      await expect(async () => await appConfig()).rejects.toThrow();
    });
  });

  describe('name', () => {
    it('should return custom app name if set', async () => {
      process.env.APP_NAME = 'Custom API';
      const config = await appConfig();
      expect(config.name).toBe('Custom API');
    });

    it('should fallback to default if not set', async () => {
      delete process.env.APP_NAME;
      const config = await appConfig();
      expect(config.name).toBe('NestJS API');
    });
  });

  describe('port and url', () => {
    it('should return parsed port and url', async () => {
      process.env.APP_PORT = '3000';
      process.env.APP_URL = 'http://localhost:3000';
      const config = await appConfig();
      expect(config.port).toBe(3000);
      expect(config.url).toBe('http://localhost:3000');
    });

    it('should fallback to port 8000 when APP_PORT not set', async () => {
      delete process.env.APP_PORT;
      delete process.env.APP_URL;
      const config = await appConfig();
      expect(config.port).toBe(8000);
      expect(config.url).toBe('http://localhost:8000');
    });

    it('should throw when APP_PORT is invalid', async () => {
      process.env.APP_PORT = 'invalid';
      await expect(async () => await appConfig()).rejects.toThrow();
    });
  });

  describe('other properties', () => {
    it('should handle debug, apiPrefix, fallbackLanguage, logService', async () => {
      process.env.APP_DEBUG = 'true';
      process.env.API_PREFIX = 'v1';
      process.env.APP_FALLBACK_LANGUAGE = 'vi';
      process.env.APP_LOG_SERVICE = LogService.CONSOLE;
      const config = await appConfig();
      expect(config.debug).toBe(true);
      expect(config.apiPrefix).toBe('v1');
      expect(config.fallbackLanguage).toBe('vi');
      expect(config.logService).toBe(LogService.CONSOLE);
    });
  });
});
