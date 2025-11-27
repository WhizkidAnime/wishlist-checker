import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

interface ReservationModalProps {
  itemName: string;
  onConfirm: (name: string, isAnonymous: boolean) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  itemName,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  const { getThemeConfig } = useTheme();
  const themeConfig = getThemeConfig();
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAnonymous && !name.trim()) {
      setError('Пожалуйста, введите ваше имя');
      return;
    }

    try {
      await onConfirm(name.trim(), isAnonymous);
    } catch (err: any) {
      setError(err?.message || 'Произошла ошибка');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md ${themeConfig.cardBackground} rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-200`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={isLoading}
        >
          <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={`text-xl font-semibold ${themeConfig.text} mb-2`}>
          Забронировать подарок
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">
          {itemName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор типа бронирования */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
              <input
                type="radio"
                name="reservationType"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(true)}
                className="w-4 h-4 text-blue-600"
                disabled={isLoading}
              />
              <div>
                <div className={`font-medium ${themeConfig.text}`}>Анонимно</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Создатель вишлиста не узнает кто забронировал
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
              <input
                type="radio"
                name="reservationType"
                checked={!isAnonymous}
                onChange={() => setIsAnonymous(false)}
                className="w-4 h-4 text-blue-600"
                disabled={isLoading}
              />
              <div>
                <div className={`font-medium ${themeConfig.text}`}>С именем</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Ваше имя будет видно создателю вишлиста
                </div>
              </div>
            </label>
          </div>

          {/* Поле ввода имени */}
          {!isAnonymous && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className={`block text-sm font-medium ${themeConfig.text} mb-1.5`}>
                Ваше имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите имя..."
                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 ${themeConfig.cardBackground} ${themeConfig.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                maxLength={100}
                disabled={isLoading}
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Бронирование...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Забронировать</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;
