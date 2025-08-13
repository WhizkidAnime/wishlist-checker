import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export interface MoneyStats {
  currency: string;
  totalAll: number;
  totalBought: number;
  totalsByCategory: {
    category: string;
    total: number;
    bought: number;
    count: number;
    boughtCount: number;
  }[];
}

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  moneyStats?: MoneyStats;
}

type DisplayPref = 'full_name' | 'nickname';

type SettingsTab = 'profile' | 'money';

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose, moneyStats }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [displayPref, setDisplayPref] = useState<DisplayPref>('full_name');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropMouseDownOnSelf = useRef(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const canUseSupabase = isSupabaseAvailable() && !!supabase;

  useEffect(() => {
    if (!isOpen) return;
    if (!isAuthenticated || !user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const meta = (user.user_metadata || {}) as any;
        setFullName(String(meta.full_name || meta.name || '') || '');
        setNickname(String(meta.nickname || meta.preferred_username || '') || '');

        if (canUseSupabase) {
          const { data, error } = await supabase!
            .from('user_preferences' as any)
            .select('display_name_pref')
            .eq('user_id', user.id)
            .single();
          if (!error && data && (data as any).display_name_pref) {
            const v = (data as any).display_name_pref as DisplayPref;
            if (v === 'full_name' || v === 'nickname') setDisplayPref(v);
          } else if (meta.display_name_pref === 'full_name' || meta.display_name_pref === 'nickname') {
            setDisplayPref(meta.display_name_pref);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Не удалось загрузить настройки');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, isAuthenticated, user?.id]);

  // Блокировка скролла фона и фокус‑менеджмент по стандартам доступности
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    // Фиксируем положение страницы и скрываем скроллбар (без скачка контента)
    const scrollY = window.scrollY || window.pageYOffset;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Фокусируем первый интерактивный элемент в модалке
    const focusFirst = () => {
      if (!dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialogRef.current.focus();
      }
    };
    // Небольшая задержка для корректной фокусировки после монтирования
    const id = window.setTimeout(focusFirst, 0);

    return () => {
      window.clearTimeout(id);
      // Возвращаем скролл в предыдущее положение
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.paddingRight = originalPaddingRight;
      window.scrollTo(0, scrollY);

      // Возвращаем фокус куда был
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen]);

  // Ловушка фокуса и обработка Escape/Tab
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab' && dialogRef.current) {
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
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

  const displayPreview = useMemo(() => {
    if (displayPref === 'nickname' && nickname.trim()) return nickname.trim();
    if (fullName.trim()) return fullName.trim();
    return user?.email || 'Пользователь';
  }, [displayPref, fullName, nickname, user?.email]);

  const save = async () => {
    if (!isAuthenticated || !user) return;
    setSaving(true);
    setError(null);
    try {
      if (!canUseSupabase) throw new Error('Supabase недоступен');

      const metaUpdate: Record<string, any> = { ...user.user_metadata };
      metaUpdate.full_name = fullName.trim();
      metaUpdate.nickname = nickname.trim();
      metaUpdate.display_name_pref = displayPref;

      const { error: updErr } = await supabase!.auth.updateUser({ data: metaUpdate });
      if (updErr) throw updErr;

      const { error: prefErr } = await supabase!
        .from('user_preferences' as any)
        .upsert(
          { user_id: user.id, display_name_pref: displayPref, updated_at: new Date().toISOString() } as any,
          { onConflict: 'user_id' }
        );
      if (prefErr) {
        // если таблицы нет — не критично, есть фолбек в метаданных
      }

      window.dispatchEvent(new CustomEvent('userProfileUpdated'));
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      aria-modal
      role="dialog"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md sm:max-w-4xl rounded-2xl shadow-xl p-0 overflow-hidden border border-theme-border flex flex-col"
        style={{
          backgroundColor: 'var(--color-card-background)',
          // Единый размер модалки: максимальная высота и фиксированная рабочая область
          height: 'min(85vh, calc(100dvh - 32px))',
          maxHeight: 'min(85vh, calc(100dvh - 32px))',
          // Разрешаем жесты/скролл внутри карточки, в том числе на мобильных
          touchAction: 'auto'
        }}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-theme-border">
          <h3 className="text-lg font-semibold text-theme-primary">Настройки</h3>
          <button onClick={onClose} className="text-theme-secondary hover:text-theme-primary transition-colors" aria-label="Закрыть">✕</button>
        </div>

        {/* Мобильная верхняя навигация (вместо левого сайдбара) */}
        <nav className="sm:hidden border-b border-theme-border px-2 py-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-card-background)' }}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === 'profile' ? 'bg-gray-100 dark:bg-gray-700 text-theme-primary' : 'text-theme-primary hover:bg-theme-hover'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/></svg>
              Личные данные
            </button>
            <button
              onClick={() => setActiveTab('money')}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === 'money' ? 'bg-gray-100 dark:bg-gray-700 text-theme-primary' : 'text-theme-primary hover:bg-theme-hover'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm0 8h.01M19 14h.01"/></svg>
              Финансы
            </button>
          </div>
        </nav>

        {/* Тело: левый сайдбар (для sm+) + правая область. Контейнер фиксированной высоты с локальным скроллом */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col sm:grid sm:grid-cols-[220px_1fr] sm:min-h-[420px]">
          {/* Сайдбар для десктопа */}
          <nav className="hidden sm:block border-r border-theme-border p-2 sm:p-3 overflow-y-auto">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-gray-100 dark:bg-gray-700 text-theme-primary'
                      : 'text-theme-primary hover:bg-theme-hover'
                  }`}
                >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/></svg>
                  Личные данные
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('money')}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeTab === 'money'
                      ? 'bg-gray-100 dark:bg-gray-700 text-theme-primary'
                      : 'text-theme-primary hover:bg-theme-hover'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm0 8h.01M19 14h.01"/></svg>
                  Финансы
                </button>
              </li>
            </ul>
          </nav>

          {/* Контент вкладок */}
          <section
            className={`p-4 sm:p-6 min-h-0 h-full flex-1 ${activeTab === 'money' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}
            style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' as any }}
          >
            {activeTab === 'profile' && (
              <div className="flex flex-col h-full">
                <h4 className="text-base font-semibold text-theme-primary mb-2">Личные данные</h4>
                <p className="text-xs text-theme-secondary mb-4">Эти данные используются для отображения имени в публичных материалах и ссылках.</p>

                {error && <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Имя и фамилия</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Например: Иван Иванов"
                      className="w-full h-10 text-sm px-3 rounded-lg border border-gray-300 dark:border-gray-600 input-surface"
                      maxLength={120}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Псевдоним / логин</label>
                    <input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Например: whizkid"
                      className="w-full h-10 text-sm px-3 rounded-lg border border-gray-300 dark:border-gray-600 input-surface"
                      maxLength={60}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">Что показывать в публичных местах</div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="displayPref"
                        className="h-4 w-4"
                        checked={displayPref === 'full_name'}
                        onChange={() => setDisplayPref('full_name')}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Имя и фамилия</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="displayPref"
                        className="h-4 w-4"
                        checked={displayPref === 'nickname'}
                        onChange={() => setDisplayPref('nickname')}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Псевдоним / логин</span>
                    </label>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-theme-hover rounded-lg p-2">Предпросмотр: <span className="font-medium text-gray-900 dark:text-gray-100">{displayPreview}</span></div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={onClose} className="h-10 px-4 rounded-full text-sm btn-cancel-surface">Отмена</button>
                  <button onClick={save} disabled={saving || loading} className="h-10 px-4 rounded-full text-sm btn-primary disabled:opacity-50">{saving ? 'Сохранение...' : 'Сохранить'}</button>
                </div>
              </div>
            )}

            {activeTab === 'money' && (
              <div className="flex flex-col min-h-0 h-full">
                {/* Фиксированный заголовок вкладки, вне области прокрутки контента */}
                <div className="z-20 pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-theme-border" style={{ backgroundColor: 'var(--color-card-background)' }}>
                  <h4 className="text-base font-semibold text-theme-primary mb-1">Финансовая статистика</h4>
                  <p className="text-xs text-theme-secondary">Суммы рассчитаны по всем товарам вашего списка желаний.</p>
                </div>

                {/* Прокручиваемая область только для данных */}
                <div className="min-h-0 flex-1 overflow-y-auto pt-2" style={{ WebkitOverflowScrolling: 'touch' as any }}>
                  {!moneyStats ? (
                    <div className="text-sm text-theme-secondary">Данные недоступны.</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="rounded-xl p-3 border border-theme-border" style={{ backgroundColor: 'var(--color-card-background)' }}>
                          <div className="text-xs text-theme-secondary">Общая сумма</div>
                          <div className="mt-1 text-lg font-semibold text-theme-primary">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: moneyStats.currency, maximumFractionDigits: 0 }).format(moneyStats.totalAll)}
                          </div>
                        </div>
                        <div className="rounded-xl p-3 border border-theme-border" style={{ backgroundColor: 'var(--color-card-background)' }}>
                          <div className="text-xs text-theme-secondary">Куплено</div>
                          <div className="mt-1 text-lg font-semibold text-theme-primary">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: moneyStats.currency, maximumFractionDigits: 0 }).format(moneyStats.totalBought)}
                          </div>
                        </div>
                        <div className="rounded-xl p-3 border border-theme-border" style={{ backgroundColor: 'var(--color-card-background)' }}>
                          <div className="text-xs text-theme-secondary">Осталось</div>
                          <div className="mt-1 text-lg font-semibold text-theme-primary">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: moneyStats.currency, maximumFractionDigits: 0 }).format(Math.max(0, moneyStats.totalAll - moneyStats.totalBought))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-theme-primary mb-2">По категориям</div>
                        <div className="rounded-xl border border-theme-border overflow-hidden">
                          <div className="divide-y divide-theme-border">
                            {moneyStats.totalsByCategory.length === 0 ? (
                              <div className="p-3 text-sm text-theme-secondary">Категорий нет</div>
                            ) : (
                              moneyStats.totalsByCategory.map(cat => (
                                <div key={cat.category} className="p-3" style={{ backgroundColor: 'var(--color-card-background)' }}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-theme-primary truncate">{cat.category}</div>
                                      <div className="text-xs text-theme-secondary mt-1">{cat.count} шт. • куплено {cat.boughtCount}</div>
                                    </div>
                                    <div className="text-right ml-3">
                                      <div className="text-sm font-semibold text-theme-primary">
                                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: moneyStats.currency, maximumFractionDigits: 0 }).format(cat.total)}
                                      </div>
                                      {cat.bought > 0 && (
                                        <div className="text-xs text-theme-secondary mt-1">
                                          куплено {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: moneyStats.currency, maximumFractionDigits: 0 }).format(cat.bought)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
