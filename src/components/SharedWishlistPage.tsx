import React, { useEffect, useState } from 'react';
import { loadSharedPayloadFromQuery, SharePayloadV1, SharePayloadV1Item } from '../utils/share';
import { useTheme } from '../hooks/useTheme';

export const SharedWishlistPage: React.FC = () => {
  const { getThemeConfig } = useTheme();
  const themeConfig = getThemeConfig();
  const [data, setData] = useState<SharePayloadV1 | null>(null);
  const authorLabel = data?.author || data?.authorEmail || '';

  useEffect(() => {
    let mounted = true;
    loadSharedPayloadFromQuery().then((payload) => {
      if (mounted) setData(payload);
    });
    return () => { mounted = false; };
  }, []);

  if (!data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeConfig.background}`}>
        <div className={`${themeConfig.cardBackground} rounded-3xl shadow-lg p-8 text-center max-w-md mx-4`}>
          <h2 className={`text-xl font-semibold ${themeConfig.text} mb-2`}>Ссылка недействительна</h2>
          <p className="text-gray-500 dark:text-gray-400">Проверьте адрес ссылки или попросите отправить заново.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-6 sm:py-12 px-2 sm:px-4 ${themeConfig.background} transition-colors duration-200`}>
      <div className={`w-full max-w-4xl ${themeConfig.cardBackground} rounded-3xl shadow-lg p-4 sm:p-8 mx-auto`}>
        <div className="mb-6">
          <h1 className={`text-2xl sm:text-3xl font-bold ${themeConfig.text}`}>Список желаний</h1>
          {authorLabel && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">от {authorLabel}</p>
          )}
        </div>

        {!data || data.items.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-t border-gray-200 dark:border-gray-600">
            Пусто
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.items.map((it: SharePayloadV1Item, idx: number) => (
              <div key={idx} className="rounded-2xl border border-gray-200 dark:border-gray-600 p-4">
                <div className="font-medium text-gray-800 dark:text-gray-200 break-words">
                  {it.link ? (
                    <a className="underline hover:text-blue-600 dark:hover:text-blue-400" href={it.link} target="_blank" rel="noopener noreferrer">{it.name}</a>
                  ) : (
                    it.name
                  )}
                </div>
                {it.itemType && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{it.itemType}</div>
                )}
                {it.comment && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 break-words">{it.comment}</div>
                )}
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {it.price.toLocaleString()} {it.currency}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


