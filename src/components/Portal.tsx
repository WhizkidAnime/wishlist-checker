import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

/**
 * Portal компонент для рендеринга выпадающих элементов поверх всего контента
 * Решает проблемы с z-index и stacking context
 */
export const Portal: React.FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
};

/**
 * ModalPortal - специальный портал для модальных окон
 * Рендерит в отдельный div #modals, полностью изолированный от основного приложения
 */
export const ModalPortal: React.FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  // Ищем специальный div для модалей
  const modalsContainer = document.getElementById('modals');
  if (!modalsContainer) {
    console.error('Контейнер #modals не найден!');
    return null;
  }

  return createPortal(children, modalsContainer);
}; 