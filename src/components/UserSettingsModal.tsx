import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DisplayPref = 'full_name' | 'nickname';

type SettingsTab = 'profile';

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [displayPref, setDisplayPref] = useState<DisplayPref>('full_name');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropMouseDownOnSelf = useRef(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      aria-modal
      role="dialog"
    >
      <div
        className="w-full max-w-md sm:max-w-4xl rounded-2xl shadow-xl p-0 overflow-hidden border border-theme-border"
        style={{ backgroundColor: 'var(--color-card-background)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-theme-border">
          <h3 className="text-lg font-semibold text-theme-primary">Настройки</h3>
          <button onClick={onClose} className="text-theme-secondary hover:text-theme-primary transition-colors" aria-label="Закрыть">✕</button>
        </div>

        {/* Мобильная верхняя навигация (вместо левого сайдбара) */}
        <nav className="sm:hidden border-b border-theme-border px-2 py-2">
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === 'profile' ? 'bg-gray-100 dark:bg-gray-700 text-theme-primary' : 'text-theme-primary hover:bg-theme-hover'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/></svg>
              Личные данные
            </button>
          </div>
        </nav>

        {/* Тело: левый сайдбар (для sm+) + правая область */}
        <div className="sm:grid sm:grid-cols-[220px_1fr] min-h-[420px]">
          {/* Сайдбар для десктопа */}
          <nav className="hidden sm:block border-r border-theme-border p-2 sm:p-3">
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
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5З"/></svg>
                  Личные данные
                </button>
              </li>
            </ul>
          </nav>

          {/* Контент вкладок */}
          <section className="p-4 sm:p-6">
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
          </section>
        </div>
      </div>
    </div>
  );
};
