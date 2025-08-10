// URL utilities with safe normalization and validation

export const safeFormatUrl = (rawUrl: string | undefined | null): string | null => {
  if (!rawUrl) return null;
  let url = String(rawUrl).trim();
  if (!url) return null;
  // Disallow dangerous schemes
  if (/^\s*javascript:/i.test(url) || /^\s*data:/i.test(url)) return null;
  // Disallow other custom schemes
  if (/^[a-zA-Z]+:/i.test(url) && !/^https?:/i.test(url)) return null;
  // Add https if schema missing, disallow protocol-relative
  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith('//')) return null;
    url = `https://${url}`;
  }
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
};

export const isValidHttpUrl = (rawUrl: string | undefined | null): boolean => {
  return safeFormatUrl(rawUrl) !== null;
};



