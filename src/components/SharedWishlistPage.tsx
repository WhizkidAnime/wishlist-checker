import React, { useEffect, useMemo, useState, lazy, Suspense, useCallback } from 'react';
import {
  loadSharedPayloadFromQuery,
  SharePayloadV1,
  SharePayloadV1Item,
  loadShareDataWithReservations,
  getShareReservations,
  createReservation,
  cancelReservation,
  getShareIdFromUrl,
  Reservation,
} from '../utils/share';
import { useTheme } from '../hooks/useTheme';
import { safeFormatUrl } from '../utils/url';
import { ReservationModal } from './ReservationModal';
import { ThemeToggle } from './ThemeToggle';

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

// Расширенный тип элемента с индексом для бронирования
interface ItemWithIndex extends SharePayloadV1Item {
  originalIndex: number;
}

// Группа с расширенными элементами
interface ItemGroup {
  category: string;
  items: ItemWithIndex[];
}

export const SharedWishlistPage: React.FC = () => {
  const {
    themeMode,
    systemTheme,
    getThemeConfig,
    supportsAutoTheme,
    setTheme,
  } = useTheme();
  const themeConfig = getThemeConfig();
  const [data, setData] = useState<SharePayloadV1 | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [shareId, setShareId] = useState<string | null>(null);

  // Модальное окно бронирования
  const [reservationModal, setReservationModal] = useState<{
    open: boolean;
    itemIndex: number;
    itemName: string;
  }>({ open: false, itemIndex: -1, itemName: '' });
  const [reservationLoading, setReservationLoading] = useState(false);

  // Уведомления
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const authorLabel = data?.author || data?.authorEmail || '';

  // Загрузка данных
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const shortId = getShareIdFromUrl();
      
      if (shortId) {
        setShareId(shortId);
        // Пробуем загрузить с бронированиями (проверка владельца)
        const dataWithReservations = await loadShareDataWithReservations(shortId);
        
        if (mounted && dataWithReservations) {
          setData(dataWithReservations.payload);
          setIsOwner(dataWithReservations.is_owner);
          setReservations(dataWithReservations.reservations);
          setLoaded(true);
          return;
        }

        // Загружаем бронирования отдельно для гостей
        if (mounted) {
          const reservs = await getShareReservations(shortId);
          setReservations(reservs);
        }
      }

      // Фоллбэк на обычную загрузку
      const payload = await loadSharedPayloadFromQuery();
      if (mounted) {
        setData(payload);
        setLoaded(true);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  // Загрузка remark-gfm по требованию
  useEffect(() => {
    if (data?.note) {
      loadGfm();
    }
  }, [data?.note]);

  // Создание Set забронированных индексов для быстрого поиска
  const reservedIndexes = useMemo(() => {
    return new Set(reservations.map(r => r.item_index));
  }, [reservations]);

  // Получить информацию о бронировании по индексу
  const getReservationInfo = useCallback((index: number): Reservation | undefined => {
    return reservations.find(r => r.item_index === index);
  }, [reservations]);

  // Группировка по категориям с сохранением оригинального индекса
  const itemsForGroups = data?.items ?? [];
  const groups: ItemGroup[] = useMemo(() => {
    const map = new Map<string, ItemWithIndex[]>();
    
    itemsForGroups.forEach((it, index) => {
      const key = it.category || 'Без категории';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ ...it, originalIndex: index });
    });

    const toSorted = (arr: ItemWithIndex[]) =>
      [...arr].sort((a, b) => {
        const aType = (a.itemType || '').toLowerCase();
        const bType = (b.itemType || '').toLowerCase();
        const typeCmp = aType.localeCompare(bType);
        if (typeCmp !== 0) return typeCmp;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

    return Array.from(map.entries()).map(([cat, items]) => ({
      category: cat,
      items: toSorted(items),
    }));
  }, [itemsForGroups]);

  // Фильтрация групп: для гостей скрываем забронированные
  const visibleGroups: ItemGroup[] = useMemo(() => {
    if (isOwner) return groups;

    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(it => !reservedIndexes.has(it.originalIndex)),
      }))
      .filter(group => group.items.length > 0);
  }, [groups, isOwner, reservedIndexes]);

  // Счётчики для владельца
  const totalItems = itemsForGroups.length;
  const reservedCount = reservations.length;
  const availableCount = totalItems - reservedCount;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (cat: string) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  // Показать toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Открыть модалку бронирования
  const openReservationModal = (itemIndex: number, itemName: string) => {
    setReservationModal({ open: true, itemIndex, itemName });
  };

  // Подтвердить бронирование
  const handleConfirmReservation = async (name: string, isAnonymous: boolean) => {
    if (!shareId) return;
    
    setReservationLoading(true);
    try {
      const result = await createReservation(shareId, reservationModal.itemIndex, name, isAnonymous);
      
      if (result.success) {
        // Обновляем локальное состояние
        const newReservation: Reservation = {
          item_index: reservationModal.itemIndex,
          reserved_by: isAnonymous ? null : name,
          is_anonymous: isAnonymous,
          created_at: new Date().toISOString(),
        };
        setReservations(prev => [...prev, newReservation]);
        setReservationModal({ open: false, itemIndex: -1, itemName: '' });
        showToast('Подарок успешно забронирован!', 'success');
      } else {
        showToast(result.error || 'Не удалось забронировать', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Произошла ошибка', 'error');
    } finally {
      setReservationLoading(false);
    }
  };

  // Отменить бронирование (только для владельца)
  const handleCancelReservation = async (itemIndex: number) => {
    if (!shareId || !isOwner) return;

    const result = await cancelReservation(shareId, itemIndex);
    
    if (result.success) {
      setReservations(prev => prev.filter(r => r.item_index !== itemIndex));
      showToast('Бронирование отменено', 'success');
    } else {
      showToast(result.error || 'Не удалось отменить', 'error');
    }
  };

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

  return (
    <div className={`min-h-screen flex items-center justify-center py-6 sm:py-12 px-2 sm:px-4 ${themeConfig.background} transition-colors duration-200`}>
      {/* Переключатель темы в правом верхнем углу экрана (только десктоп) */}
      <div className="fixed top-4 sm:top-12 right-4 sm:right-6 z-40 hidden sm:block">
        <ThemeToggle
          themeMode={themeMode}
          systemTheme={systemTheme}
          onSetTheme={setTheme}
          supportsAutoTheme={supportsAutoTheme}
        />
      </div>

      <div className={`relative w-full max-w-4xl ${themeConfig.cardBackground} rounded-3xl shadow-lg p-4 sm:p-8 mx-auto`}>
        {/* Заголовок */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 pr-16 sm:pr-24">
              <h1 className={`text-2xl sm:text-3xl font-bold ${themeConfig.text}`}>
                {data?.title || 'Список желаний'}
              </h1>
              {authorLabel && (
                <p className="text-gray-500 dark:text-gray-400 mt-1">от {authorLabel}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium">
                  Ваш вишлист
                </div>
              )}
              {/* Мобильный переключатель темы внутри карточки */}
              <div className="sm:hidden">
                <ThemeToggle
                  themeMode={themeMode}
                  systemTheme={systemTheme}
                  onSetTheme={setTheme}
                  isMobile
                  supportsAutoTheme={supportsAutoTheme}
                />
              </div>
            </div>
          </div>

          {/* Статистика для владельца */}
          {isOwner && totalItems > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Всего:</span>
                <span className={`font-medium ${themeConfig.text}`}>{totalItems}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-sm">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 dark:text-green-300 font-medium">{reservedCount} забронировано</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Свободно:</span>
                <span className={`font-medium ${themeConfig.text}`}>{availableCount}</span>
              </div>
            </div>
          )}

          {/* Подсказка для гостей */}
          {!isOwner && shareId && totalItems > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4m0-4h.01" />
              </svg>
              <span>Нажмите на подарок, чтобы забронировать его. Забронированные позиции скрыты от других.</span>
            </div>
          )}

          {data?.note && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
              <Suspense fallback={<div className="text-theme-text-secondary">Загрузка заметки…</div>}>
                <ReactMarkdown
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

        {/* Контент */}
        {!data || visibleGroups.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-t border-gray-200 dark:border-gray-600">
            {isOwner && reservedCount > 0 ? (
              <div>
                <svg className="w-12 h-12 mx-auto mb-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">Все подарки забронированы!</p>
              </div>
            ) : (
              'Пусто'
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {visibleGroups.map(group => (
              <div key={group.category}>
                <button
                  onClick={() => toggle(group.category)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {group.category}
                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({group.items.length})
                    </span>
                  </span>
                  <svg className={`h-5 w-5 text-gray-500 transition-transform ${collapsed[group.category] ? '-rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/>
                  </svg>
                </button>
                {!collapsed[group.category] && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.items.map((it) => {
                      const isReserved = reservedIndexes.has(it.originalIndex);
                      const reservation = getReservationInfo(it.originalIndex);
                      const canReserve = shareId && !isOwner && !isReserved;

                      return (
                        <div
                          key={it.originalIndex}
                          onClick={() => canReserve && openReservationModal(it.originalIndex, it.name)}
                          className={`rounded-2xl border p-4 transition-all ${
                            isReserved
                              ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-600'
                          } ${
                            canReserve
                              ? 'cursor-pointer hover:border-green-400 dark:hover:border-green-600 hover:shadow-md'
                              : ''
                          }`}
                        >
                          {/* Бейдж забронировано (для владельца) */}
                          {isOwner && isReserved && reservation && (
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-full">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                                <span>
                                  {reservation.is_anonymous
                                    ? 'Забронировано анонимно'
                                    : `Забронировал: ${reservation.reserved_by}`}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelReservation(it.originalIndex);
                                }}
                                className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                title="Отменить бронирование"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}

                          <div className="font-medium text-gray-800 dark:text-gray-200 break-words">
                            {(() => {
                              if (data?.options?.includeLinks === false) return it.name;
                              const safe = safeFormatUrl(it.link);
                              return safe ? (
                                <a
                                  className="underline hover:text-blue-600 dark:hover:text-blue-400"
                                  href={safe}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {it.name}
                                </a>
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

                          <div className="mt-3 flex items-center justify-between">
                            {data?.options?.includePrices !== false && (
                              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                {it.price.toLocaleString()} {it.currency}
                              </div>
                            )}
                            
                            {/* Кнопка бронирования для гостей */}
                            {canReserve && (
                              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Забронировать</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно бронирования */}
      {reservationModal.open && (
        <ReservationModal
          itemName={reservationModal.itemName}
          onConfirm={handleConfirmReservation}
          onClose={() => setReservationModal({ open: false, itemIndex: -1, itemName: '' })}
          isLoading={reservationLoading}
        />
      )}

      {/* Toast уведомления */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl shadow-lg ${
          toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        } animate-fade-in-out`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};


