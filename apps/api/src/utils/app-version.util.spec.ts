import fs from 'fs';
import {
  getPackageVersion,
  resetPackageVersionCache,
} from './app-version.util';

jest.mock('fs');

describe('App Version Utility', () => {
  beforeEach(() => {
    resetPackageVersionCache();
    jest.clearAllMocks();
  });

  it('should return package version from existing package.json', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({ version: '2.5.1' }),
    );

    const version = getPackageVersion();

    expect(version).toBe('2.5.1');
    expect(fs.existsSync).toHaveBeenCalled();
  });

  it('should return cached version on subsequent calls without reading fs again', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({ version: '3.0.0' }),
    );

    const first = getPackageVersion();
    const second = getPackageVersion();

    expect(first).toBe('3.0.0');
    expect(second).toBe('3.0.0');
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  it('should fallback to 1.0.0 if no candidate files exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const version = getPackageVersion();

    expect(version).toBe('1.0.0');
  });

  it('should continue to next candidate if JSON parsing fails', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock)
      .mockReturnValueOnce('INVALID_JSON')
      .mockReturnValueOnce(JSON.stringify({ version: '1.2.3' }));

    const version = getPackageVersion();

    expect(version).toBe('1.2.3');
  });
});
