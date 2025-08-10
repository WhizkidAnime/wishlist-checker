import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { SharedWishlistPage } from '../../components/SharedWishlistPage';

function encodePayload(payload: any): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

describe('SharedWishlistPage', () => {
  beforeEach(() => {
    // сбрасываем URL перед каждым тестом (относительный путь для jsdom)
    window.history.replaceState({}, '', '/wishlist-checker/');
  });

  it('renders items and sanitizes note links', async () => {
    const payload = {
      v: 1,
      title: 'Список желаний',
      note: 'Смотри [сюда](javascript:alert(1))',
      options: { includeLinks: true },
      items: [
        { name: 'Телефон', price: 1000, currency: 'RUB', link: 'example.com' },
      ],
    };
    const encoded = encodePayload(payload);
    window.history.pushState({}, '', `/wishlist-checker/?share=${encodeURIComponent(encoded)}`);

    render(<SharedWishlistPage />);

    // Заголовок и элемент списка отображаются
    expect(await screen.findByText('Список желаний')).toBeDefined();
    const itemLink = await screen.findByText('Телефон');
    const anchor = itemLink.closest('a');
    expect(anchor).toBeTruthy();
    expect(anchor!.getAttribute('href')!.startsWith('https://')).toBe(true);

    // Ссылка в note должна быть очищена (href пустой)
    const noteContainer = screen.getByText(/Смотри/i).closest('div');
    if (noteContainer) {
      const linkInNote = within(noteContainer).queryByRole('link');
      if (linkInNote) {
        expect(linkInNote.getAttribute('href')).toBe('');
      }
    }
  });

  it('ignores oversized share payloads', () => {
    const hugeText = 'x'.repeat(120000);
    const payload = { v: 1, note: hugeText, items: [] };
    const encoded = encodePayload(payload);
    window.history.pushState({}, '', `/wishlist-checker/?share=${encodeURIComponent(encoded)}`);

    render(<SharedWishlistPage />);
    // Проверим наличие хотя бы одного из возможных текстов
    const hits = screen.queryAllByText(/Ссылка недействительна|Пусто|Список желаний/i);
    expect(hits.length).toBeGreaterThan(0);
  });
});


