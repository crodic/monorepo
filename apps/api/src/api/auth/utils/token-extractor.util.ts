import type { Request } from 'express';

export function extractCookieToken(
  request: Request,
  cookieName: string,
): string | null {
  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (!name) continue;

    if (name.trim() === cookieName) {
      try {
        return decodeURIComponent(valueParts.join('='));
      } catch {
        return null;
      }
    }
  }

  return null;
}
