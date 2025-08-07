import React, { useMemo, useState } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { createShareUrlSmart } from '../utils/share';
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

  const selectedItems = useMemo(() => items.filter(i => selected[i.id]), [items, selected]);

  if (!isOpen) return null;

  const toggle = (id: string | number) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateLink = async () => {
    const displayName = (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name || authorName || undefined;
    const email = user?.email || undefined;
    const url = await createShareUrlSmart(selectedItems, displayName, email);
    setGeneratedUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60"
      onClick={onClose}
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

        <div className="flex-1 min-h-0 overflow-y-auto border rounded-xl border-gray-200 dark:border-gray-600">
          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Нет товаров для выбора</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 p-3">
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
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{it.itemType}</div>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{it.price.toLocaleString()} {it.currency}</div>
                </li>
              ))}
            </ul>
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
              disabled={selectedItems.length === 0}
              className="h-10 px-4 rounded-full text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-50"
            >
              Создать ссылку
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


