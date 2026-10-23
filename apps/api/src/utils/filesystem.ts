import { ImageFormat } from '../api/file/types/upload.types';
import sharp, { type Sharp } from 'sharp';

/**
 * Removes the disk path prefix from a given path.
 * The prefix is either 'storage/public/' or 'storage/private/'.
 * If the path does not start with one of the prefixes, the original path is returned.
 * @param {string} path - The path to remove the prefix from.
 * @returns {string} The path with the prefix removed.
 */
export function removeDiskPath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const prefixes = ['storage/public/', 'storage/private/'];

  const prefix = prefixes.find((p) => normalized.startsWith(p));
  return prefix ? normalized.slice(prefix.length) : normalized;
}

/**
 * Resolves a stored file path into a normalized storage key, stripping any legacy disk prefixes.
 */
export function resolveStoragePath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const legacyPrefixes = ['storage/public/', 'storage/private/'];
  const legacyPrefix = legacyPrefixes.find((prefix) =>
    normalized.includes(prefix),
  );

  if (legacyPrefix) {
    return normalized.slice(
      normalized.indexOf(legacyPrefix) + legacyPrefix.length,
    );
  }

  return removeDiskPath(normalized).replace(/^\/+/, '');
}

/**
 * Extracts the image format from a given MIME type.
 * @param {string} mime - The MIME type to extract the format from.
 * @returns {ImageFormat} The extracted image format.
 */
export function extractExt(mime: string): ImageFormat {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpeg';
  return 'webp';
}

/**
 * Applies the given format and quality to the given Sharp image.
 * @param {Sharp} img - The Sharp image to apply the format to.
 * @param {ImageFormat} format - The format to apply to the image.
 * @param {number} quality - The quality to apply to the image.
 * @returns {Sharp} The formatted image.
 */
export function applyFormat(
  img: Sharp,
  format: ImageFormat,
  quality: number,
): Sharp {
  switch (format) {
    case 'webp':
      return img.webp({ quality });
    case 'jpeg':
      return img.jpeg({ quality });
    case 'png':
      return img.png({ compressionLevel: quality >= 90 ? 1 : 9 });
    default:
      return img;
  }
}
