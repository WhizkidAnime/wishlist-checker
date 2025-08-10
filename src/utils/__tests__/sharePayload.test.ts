import { describe, it, expect } from 'vitest';
import { ShareDisplayOptionsV1 } from '../../utils/share';
// Тестируем публичные API через parseShareFromLocation косвенно неудобно — проверим санитайзер через экспорт
import * as shareMod from '../../utils/share';

// Доступ к неэкспортируемой функции через индексацию (для тестов)
const validate: any = (shareMod as any).validateAndSanitizeSharePayload;

describe('share payload validation/sanitization', () => {
  it('accepts proper payload and trims fields', () => {
    const raw = {
      v: 1,
      author: ' John ',
      title: ' Hello ',
      note: 'n',
      options: { includePrices: true, includeLinks: true },
      items: [
        { name: ' Item ', price: 1, currency: 'USD', link: 'example.com', itemType: 'type', comment: 'c', category: 'cat' },
      ],
    };
    const out = validate(raw);
    expect(out.v).toBe(1);
    expect(out.author).toBe('John');
    expect(out.items.length).toBe(1);
    expect(out.items[0].link?.startsWith('https://')).toBe(true);
  });

  it('rejects invalid items and dangerous links', () => {
    const raw = {
      v: 1,
      items: [
        { name: '', price: 1, currency: 'USD' }, // invalid: empty name
        { name: 'ok', price: -5, currency: 'USD' }, // invalid: negative
        { name: 'ok', price: 0, currency: 'USD', link: 'javascript:alert(1)' }, // invalid link
      ],
    };
    const out = validate(raw);
    expect(out.items.length).toBe(0);
  });

  it('caps excessive items', () => {
    const raw = { v: 1, items: new Array(2001).fill({ name: 'x', price: 1, currency: 'RUB' }) };
    const out = validate(raw);
    // превышение MAX_ITEMS приводит к null
    expect(out).toBeNull();
  });
});


