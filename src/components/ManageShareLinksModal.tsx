import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { deleteShareLink, listMyShareLinks, UserShareLink } from '../utils/share';

interface ManageShareLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageShareLinksModal: React.FC<ManageShareLinksModalProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [links, setLinks] = useState<UserShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmTitle, setConfirmTitle] = useState<string>('');

  const reload = async () => {
    if (!isAuthenticated || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listMyShareLinks(user.id, user.email || undefined);
      setLinks(rows);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить ссылки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    // Стабильный список хуков: внутри эффекта, без условных хуков выше
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated, user?.id]);

  // Реакция на событие успешного создания ссылки
  useEffect(() => {
    const handler = () => {
      if (isOpen) reload();
    };
    window.addEventListener('shareLinksUpdated', handler);
    return () => window.removeEventListener('shareLinksUpdated', handler);
  }, [isOpen]);

  const handleCopy = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (_) {}
  };

  const openConfirm = (id: string, title: string) => {
    setConfirmId(id);
    setConfirmTitle(title || 'Публичная ссылка');
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeletingId(confirmId);
    const res = await deleteShareLink(confirmId);
    if (!res.success) {
      setError(res.message || 'Не удалось удалить ссылку');
    }
    setConfirmId(null);
    setDeletingId(null);
    await reload();
  };

  const empty = useMemo(() => !loading && links.length === 0, [loading, links.length]);

  const backdropMouseDownOnSelf = useRef(false);

  const handleBackdropMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    backdropMouseDownOnSelf.current = e.target === e.currentTarget;
  };

  const handleBackdropMouseUp: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget && backdropMouseDownOnSelf.current) {
      onClose();
    }
    backdropMouseDownOnSelf.current = false;
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
      <div className="w-full max-w-2xl rounded-2xl shadow-xl p-4 sm:p-6 mx-auto flex flex-col max-h-[85vh] overflow-hidden" style={{ backgroundColor: 'var(--color-card-background)', contentVisibility: 'auto', containIntrinsicSize: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-theme-secondary">Мои публичные вишлисты</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" aria-label="Закрыть">✕</button>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Загрузка...</div>
          ) : empty ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Нет созданных ссылок</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 will-change-transform">
              {links.map((l) => (
                <li key={l.id} className="py-2">
                  <div className="group flex items-center justify-between gap-4 hover:bg-theme-hover rounded-lg px-2 sm:px-3 py-2 transition-colors">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13.5 6.5h3a3 3 0 010 6h-3" />
                          <path d="M10.5 17.5h-3a3 3 0 010-6h3" />
                          <path d="M8 12h8" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{l.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{l.itemsCount} шт. {l.expiresAt ? `• до ${new Date(l.expiresAt).toLocaleDateString()}` : ''}</div>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 break-all hover:underline">{l.url}</a>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleCopy(l.url, l.id)} className="h-9 px-3 rounded-full text-sm bg-theme-button text-theme-button hover:bg-theme-button transition-colors whitespace-nowrap">
                        {copiedId === l.id ? 'Скопировано' : 'Копировать'}
                      </button>
                      <button onClick={() => openConfirm(l.id, l.title)} disabled={deletingId === l.id} className="h-9 px-3 rounded-full text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 whitespace-nowrap">
                        {deletingId === l.id ? 'Удаление...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end px-2 sm:px-3">
          <button onClick={onClose} className="h-9 px-4 rounded-full text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">Закрыть</button>
        </div>

        {confirmId && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-60">
            <div className="rounded-xl shadow-xl w-full max-w-md p-6 mx-4" style={{ backgroundColor: 'var(--color-card-background)' }}>
              <h3 className="text-lg font-semibold text-black dark:text-theme-secondary mb-2">Подтвердите удаление</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Удалить ссылку «<span className="font-medium text-black dark:text-theme-secondary">{confirmTitle}</span>»? Это действие необратимо.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmId(null)} disabled={deletingId === confirmId} className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Отмена</button>
                <button onClick={confirmDelete} disabled={deletingId === confirmId} className="px-4 py-1.5 border border-transparent rounded-full text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 flex items-center">
                  {deletingId === confirmId ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Удаление...
                    </>
                  ) : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


