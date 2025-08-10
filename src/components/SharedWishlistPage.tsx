import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { loadSharedPayloadFromQuery, SharePayloadV1, SharePayloadV1Item } from '../utils/share';
import { useTheme } from '../hooks/useTheme';
import { safeFormatUrl } from '../utils/url';

// Ленивые импорты только если реально нужен markdown
const ReactMarkdown = lazy(() => import('react-markdown'));
// remark-gfm не является React-компонентом, но мы подгружаем модуль лениво
let gfmModule: any = null;
const loadGfm = async () => {
  if (!gfmModule) {
    gfmModule = (await import('remark-gfm')).default;
  }
  return gfmModule;
};

export const SharedWishlistPage: React.FC = () => {
  const { getThemeConfig } = useTheme();
  const themeConfig = getThemeConfig();
  const [data, setData] = useState<SharePayloadV1 | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const authorLabel = data?.author || data?.authorEmail || '';

  // Нормализация перенесена в utils/url

  useEffect(() => {
    let mounted = true;
    loadSharedPayloadFromQuery()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => { mounted = false; };
  }, []);

  // Группировка по категориям и сортировка внутри по itemType -> name (безусловно вызываем хук)
  const itemsForGroups = data?.items ?? [];
  const groups = useMemo(() => {
    const map = new Map<string, SharePayloadV1Item[]>();
    for (const it of itemsForGroups) {
      const key = (it as any).category || 'Без категории';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    const toSorted = (arr: SharePayloadV1Item[]) =>
      [...arr].sort((a, b) => {
        const aType = (a.itemType || '').toLowerCase();
        const bType = (b.itemType || '').toLowerCase();
        const typeCmp = aType.localeCompare(bType);
        if (typeCmp !== 0) return typeCmp;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
    return Array.from(map.entries()).map(([cat, items]) => ({ category: cat, items: toSorted(items) }));
  }, [itemsForGroups]);
  // Загрузка remark-gfm по требованию (если есть note)
  useEffect(() => {
    if (data?.note) {
      loadGfm();
    }
  }, [data?.note]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (cat: string) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  if (loaded && !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeConfig.background}`}>
        <div className={`${themeConfig.cardBackground} rounded-3xl shadow-lg p-8 text-center max-w-md mx-4`}>
          <h2 className={`text-xl font-semibold ${themeConfig.text} mb-2`}>Ссылка недействительна</h2>
          <p className="text-gray-500 dark:text-gray-400">Проверьте адрес ссылки или попросите отправить заново.</p>
        </div>
      </div>
    );
  }

  // (удалены дубликаты объявления groups/collapsed)

  return (
    <div className={`min-h-screen flex items-center justify-center py-6 sm:py-12 px-2 sm:px-4 ${themeConfig.background} transition-colors duration-200`}>
      <div className={`w-full max-w-4xl ${themeConfig.cardBackground} rounded-3xl shadow-lg p-4 sm:p-8 mx-auto`}>
        <div className="mb-6">
          <h1 className={`text-2xl sm:text-3xl font-bold ${themeConfig.text}`}>{data?.title || 'Список желаний'}</h1>
          {authorLabel && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">от {authorLabel}</p>
          )}
          {data?.note && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
              <Suspense fallback={<div className="text-theme-text-secondary">Загрузка заметки…</div>}>
                {/* По умолчанию ReactMarkdown экранирует HTML — без rehypeRaw */}
                <ReactMarkdown
                  // remarkPlugins заполним после загрузки модуля
                  remarkPlugins={[]}
                  urlTransform={(url: any) => {
                    const safe = safeFormatUrl(typeof url === 'string' ? url : String(url));
                    return safe ?? '';
                  }}
                >
                  {data.note}
                </ReactMarkdown>
              </Suspense>
            </div>
          )}
        </div>

        {!data || data.items.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-t border-gray-200 dark:border-gray-600">
            Пусто
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.category}>
                <button
                  onClick={() => toggle(group.category)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.category}</span>
                  <svg className={`h-5 w-5 text-gray-500 transition-transform ${collapsed[group.category] ? '-rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                </button>
                {!collapsed[group.category] && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.items.map((it, idx) => (
                      <div key={idx} className="rounded-2xl border border-gray-200 dark:border-gray-600 p-4">
                        <div className="font-medium text-gray-800 dark:text-gray-200 break-words">
                          {(() => {
                            if (data?.options?.includeLinks === false) return it.name;
                            const safe = safeFormatUrl(it.link);
                            return safe ? (
                              <a className="underline hover:text-blue-600 dark:hover:text-blue-400" href={safe} target="_blank" rel="noopener noreferrer">{it.name}</a>
                            ) : (
                              it.name
                            );
                          })()}
                        </div>
                        {data?.options?.includeItemType !== false && it.itemType && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{it.itemType}</div>
                        )}
                        {data?.options?.includeComments && it.comment && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 break-words">{it.comment}</div>
                        )}
                        {data?.options?.includePrices !== false && (
                          <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {it.price.toLocaleString()} {it.currency}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


