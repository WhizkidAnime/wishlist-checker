import React, { useMemo, useRef, useState } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { createShareUrlSmart, ShareDisplayOptionsV1 } from '../utils/share';
import { useAuth } from '../hooks/useAuth';

interface ShareWishlistModalProps {
  isOpen: boolean;
  items: WishlistItem[];
  authorName?: string;
  onClose: () => void;
}

export const ShareWishlistModal: React.FC<ShareWishlistModalProps> = ({ isOpen, items, authorName, onClose }) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Record<string | number, boolean>>({});
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [options, setOptions] = useState<ShareDisplayOptionsV1>({
    includePrices: true,
    includeLinks: true,
    includeComments: false,
    includeItemType: true,
  });
  const [daysToLive, setDaysToLive] = useState<string>('7');
  const [note, setNote] = useState<string>('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const backdropMouseDownOnSelf = useRef(false);

  // Группировка по категориям, сортировка по типу и имени
  const groups = useMemo(() => {
    const map = new Map<string, WishlistItem[]>();
    for (const it of items) {
      const key = it.category || 'Без категории';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    const toSorted = (arr: WishlistItem[]) =>
      [...arr].sort((a, b) => {
        const aType = (a.itemType || '').toLowerCase();
        const bType = (b.itemType || '').toLowerCase();
        const typeCmp = aType.localeCompare(bType);
        if (typeCmp !== 0) return typeCmp;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
    return Array.from(map.entries()).map(([cat, arr]) => ({ category: cat, items: toSorted(arr) }));
  }, [items]);

  const toggleGroup = (cat: string) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  const selectedItems = useMemo(() => items.filter(i => selected[i.id]), [items, selected]);

  if (!isOpen) return null;

  const toggle = (id: string | number) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateLink = async () => {
    if (creating) return;
    setCreating(true);
    const displayName = (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name || authorName || undefined;
    // Больше не включаем email в публичный payload
    const expiresAt = (() => {
      const days = parseInt(daysToLive, 10);
      if (!isNaN(days) && days > 0 && days <= 365) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString();
      }
      return null;
    })();

    const url = await createShareUrlSmart(selectedItems, displayName, user?.email || undefined, {
      title: title.trim() || undefined,
      options,
      expiresAt,
      note: note.trim() || undefined,
      ownerUserId: user?.id,
    });
    setGeneratedUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // ignore
    }
    setCreating(false);
  };

  const handleBackdropMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    backdropMouseDownOnSelf.current = e.target === e.currentTarget;
  };

  const handleBackdropMouseUp: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget && backdropMouseDownOnSelf.current) {
      onClose();
    }
    backdropMouseDownOnSelf.current = false;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      aria-modal
      role="dialog"
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-xl p-4 sm:p-6 mx-auto flex flex-col max-h-[85vh] overflow-hidden"
        style={{ backgroundColor: 'var(--color-card-background)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-theme-secondary">Поделиться вишлистом</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" aria-label="Закрыть">
            ✕
          </button>
        </div>

        {/* Заголовок публичного списка */
        }
        <div className="mb-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Название публичного списка (опционально)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: подарки к ДР"
            className="w-full h-10 text-sm px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            maxLength={200}
          />
        </div>

        {/* Мини-настройки отображения + срок жизни */}
        <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 gap-2 items-start">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={!!options.includePrices} onChange={(e) => setOptions(o => ({ ...o, includePrices: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
            Показывать цены
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={!!options.includeLinks} onChange={(e) => setOptions(o => ({ ...o, includeLinks: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
            Ссылки на товары
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={!!options.includeItemType} onChange={(e) => setOptions(o => ({ ...o, includeItemType: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
            Тип товара
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={!!options.includeComments} onChange={(e) => setOptions(o => ({ ...o, includeComments: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
            Комментарии
          </label>
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <span className="text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">Срок жизни ссылки</span>
            <input
              type="number"
              min={1}
              max={365}
              step={1}
              value={daysToLive}
              onChange={(e) => setDaysToLive(e.target.value)}
              className="h-9 w-24 text-sm px-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">дн.</span>
          </div>
        </div>

        {/* Описание на всю ширину */}
        <div className="mb-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Описание</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Например: пожелания по цвету/размеру, общая информация и т.д."
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 min-h-28"
            rows={5}
            maxLength={4000}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto border rounded-xl border-gray-200 dark:border-gray-600">
          {groups.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Нет товаров для выбора</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {groups.map(group => (
                <div key={group.category} className="p-0">
                  <button
                    onClick={() => toggleGroup(group.category)}
                    className="w-full flex items-center justify-between px-3 py-2"
                  >
                    <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{group.category}</span>
                    <svg className={`h-4 w-4 text-gray-500 transition-transform ${collapsed[group.category] ? '-rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                  </button>
                  {!collapsed[group.category] && (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      {group.items.map((it) => (
                        <li key={it.id} className="flex items-center gap-3 px-3 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!selected[it.id]}
                            onChange={() => toggle(it.id)}
                            aria-label={`Выбрать ${it.name}`}
                            style={{ accentColor: 'var(--color-primary)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 dark:text-gray-200 break-words">{it.name}</div>
                            {it.itemType && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{it.itemType}</div>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{it.price.toLocaleString()} {it.currency}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {/* Левая группа: поле ссылки + иконка копирования (всегда рендерим для стабильного лэйаута) */}
          <div className={`relative flex items-center gap-2 min-w-[220px] flex-1 ${generatedUrl ? '' : 'opacity-0 pointer-events-none select-none'}`}>
            <input
              readOnly
              value={generatedUrl || ''}
              placeholder="Ссылка появится здесь"
              className="w-full h-10 text-xs sm:text-sm px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={() => generatedUrl && navigator.clipboard.writeText(generatedUrl)}
              aria-label="Скопировать ссылку"
              className="h-10 w-10 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center disabled:opacity-50"
              disabled={!generatedUrl}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1Zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2Zm0 16H8V7h11v14Z"/>
              </svg>
            </button>
            {copied && (
              <span className="absolute -bottom-5 left-0 text-xs text-green-600">Скопировано</span>
            )}
          </div>

          {/* Правая группа: действия */}
          <div className="flex gap-2 flex-shrink-0 ml-auto">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-full text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateLink}
              disabled={selectedItems.length === 0 || creating}
              className="h-10 px-4 rounded-full text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-50"
            >
              {creating ? 'Создание...' : 'Создать ссылку'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


