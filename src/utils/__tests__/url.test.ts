import { describe, it, expect } from 'vitest';
import { safeFormatUrl, isValidHttpUrl } from '../../utils/url';

describe('url utils', () => {
  it('accepts http and https', () => {
    expect(safeFormatUrl('http://example.com/a')).toBe('http://example.com/a');
    expect(safeFormatUrl('https://example.com')).toBe('https://example.com/');
  });

  it('adds https when missing', () => {
    const u = safeFormatUrl('example.com/path');
    expect(u).toBe('https://example.com/path');
  });

  it('rejects javascript and data protocols', () => {
    expect(safeFormatUrl('javascript:alert(1)')).toBeNull();
    expect(safeFormatUrl('data:text/html;base64,abcd')).toBeNull();
  });

  it('rejects non-http protocols', () => {
    expect(safeFormatUrl('ftp://example.com')).toBeNull();
    expect(safeFormatUrl('custom:thing')).toBeNull();
    expect(safeFormatUrl('//example.com')).toBeNull();
  });

  it('isValidHttpUrl mirrors safeFormatUrl', () => {
    expect(isValidHttpUrl('https://ok')).toBe(true);
    expect(isValidHttpUrl('javascript:bad')).toBe(false);
  });
});


