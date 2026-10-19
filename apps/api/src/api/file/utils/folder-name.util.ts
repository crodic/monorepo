export const FILE_FOLDER_NAME_PATTERN =
  /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,100}(?:\/[\p{L}\p{N}][\p{L}\p{N} ._-]{0,100})*$/u;

export const FILE_FOLDER_NAME_MESSAGE =
  'Folder path must consist of valid folder segments separated by slashes. Each segment must start with a letter or number and contain letters, numbers, spaces, dots, underscores, or hyphens.';

export function normalizeFolderName(folder?: string | null): string | null {
  if (folder == null) {
    return null;
  }

  const normalized = folder
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/');

  return normalized.length > 0 ? normalized : null;
}

export function isValidFolderName(folder: string): boolean {
  return folder.length <= 255 && FILE_FOLDER_NAME_PATTERN.test(folder);
}
