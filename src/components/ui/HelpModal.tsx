import React, { useEffect } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  // Блокируем скролл фона при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-theme-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-theme-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-theme-border bg-theme-card sticky top-0 z-10">
          <h2 className="text-xl font-bold text-theme-primary">
            📚 Справка по приложению
          </h2>
          <button
            onClick={onClose}
            className="text-theme-secondary hover:text-theme-primary transition-colors p-2 rounded-lg hover:bg-theme-hover"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-theme-secondary">
          {/* Категории */}
          <section>
            <h3 className="text-lg font-semibold text-theme-primary mb-3 flex items-center">
              🗂️ Категории
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong className="text-theme-primary">Переключение:</strong> нажимайте на вкладки для переключения между категориями</p>
              <p><strong className="text-theme-primary">Создание:</strong> кнопка «+» создает новую категорию</p>
              <p><strong className="text-theme-primary">Удаление:</strong> на десктопе наведите курсор на категорию и нажмите крестик; на мобиле дважды тапните по активной категории</p>
              <p><strong className="text-theme-primary">«Без категории»:</strong> показывает товары без категории</p>
              <p><strong className="text-theme-primary">Счетчики:</strong> цифры показывают количество товаров в каждой категории</p>
            </div>
          </section>

          {/* Добавление товаров */}
          <section>
            <h3 className="text-lg font-semibold text-theme-primary mb-3 flex items-center">
              ➕ Добавление товаров
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong className="text-theme-primary">Тип товара (опционально):</strong> можете указать тип товара, например «Электроника» или «Книги»</p>
              <p><strong className="text-theme-primary">Название:</strong> обязательное поле для описания желания</p>
              <p><strong className="text-theme-primary">Цена:</strong> введите стоимость с автоматическим форматированием (сложение, умножение, деление, вычитание)</p>
              <p><strong className="text-theme-primary">Ссылка:</strong> добавьте URL на товар (необязательно)</p>
              <p><strong className="text-theme-primary">Категория:</strong> выберите существующую, впишите новую или оставьте пустой</p>
            </div>
          </section>

          {/* Управление товарами */}
          <section>
            <h3 className="text-lg font-semibold text-theme-primary mb-3 flex items-center">
              ⚙️ Управление товарами
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong className="text-theme-primary">Покупка:</strong> галочка слева отмечает товар как купленный и перемещает в самый низ списка</p>
              <p><strong className="text-theme-primary">Калькулятор:</strong> кнопка «+» добавляет товар в расчет общей стоимости набора товаров</p>
              <p><strong className="text-theme-primary">Редактирование:</strong> кнопка «✏️» открывает форму изменения</p>
              <p><strong className="text-theme-primary">Удаление:</strong> кнопка «🗑️» удаляет товар с подтверждением</p>
              <p><strong className="text-theme-primary">Перемещение:</strong> значок «^» вверх или вниз позволяет перетаскивать товары</p>
            </div>
          </section>

          {/* Массовые операции */}
          <section>
            <h3 className="text-lg font-semibold text-theme-primary mb-3 flex items-center">
              📦 Массовые операции
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong className="text-theme-primary">Выбор:</strong> квадратные чекбоксы справа выбирают несколько товаров</p>
              <p><strong className="text-theme-primary">Панель действий:</strong> появляется при выборе товаров</p>
              <p><strong className="text-theme-primary">Перемещение:</strong> переносит выбранные товары в другую категорию</p>
              <p><strong className="text-theme-primary">Удаление:</strong> удаляет все выбранные товары одновременно</p>
              <p><strong className="text-theme-primary">Отмена:</strong> снимает выделение со всех товаров</p>
            </div>
          </section>

          {/* Поиск и сортировка */}
          <section>
            <h3 className="text-lg font-semibold text-theme-primary mb-3 flex items-center">
              🔍 Поиск и сортировка
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong className="text-theme-primary">Поиск:</strong> находит товары по названию во всех категориях</p>
              <p><strong className="text-theme-primary">Очистка поиска:</strong> кнопка «×» очищает строку поиска</p>
              <p><strong className="text-theme-primary">Сортировка:</strong> кнопки «⇅» сортирует по алфавиту или цене</p>
              <p><strong className="text-theme-primary">Экспорт:</strong> сохраняет данные в файл</p>
              <p><strong className="text-theme-primary">Импорт:</strong> загружает данные из файла</p>
            </div>
          </section>

          {/* Калькулятор */}
          <section>
            <h3 className="text-lg font-semibold text-theme-primary mb-3 flex items-center">
              🧮 Калькулятор стоимости
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong className="text-theme-primary">Добавление:</strong> кнопка «+» в кружке у товаров добавляет их в расчет</p>
              <p><strong className="text-theme-primary">Общая сумма:</strong> показывается в нижней части экрана</p>
              <p><strong className="text-theme-primary">Список товаров:</strong> в калькуляторе видны все добавленные товары</p>
              <p><strong className="text-theme-primary">Удаление:</strong> кнопка «×» убирает товар из расчета</p>
              <p><strong className="text-theme-primary">Очистка:</strong> кнопка «очистить всё» обнуляет калькулятор</p>
            </div>
          </section>

          {/* Дополнительные функции */}
          <section>
            <h3 className="text-lg font-semibold text-theme-primary mb-3 flex items-center">
              🎨 Дополнительно
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong className="text-theme-primary">Смена темы:</strong> кнопка солнца/луны переключает светлую/темную тему</p>
              <p><strong className="text-theme-primary">Автотема:</strong> следует системным настройкам устройства</p>
              <p><strong className="text-theme-primary">Синхронизация:</strong> данные автоматически сохраняются в браузере</p>
              <p><strong className="text-theme-primary">PWA:</strong> приложение можно установить на главный экран</p>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-theme-border bg-theme-card">
          <button
            onClick={onClose}
            className="w-full py-3 bg-theme-button text-theme-button rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:bg-theme-button active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Понятно, спасибо!
          </button>
        </div>
      </div>
    </div>
  );
}; 