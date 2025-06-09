import React from 'react';
import { ErrorPage } from './ErrorPage';

interface NotFoundPageProps {
  onReturnHome?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onReturnHome }) => {
  return (
    <ErrorPage
      errorCode="404"
      title="Страница не найдена"
      description="Запрашиваемая страница не существует или была перемещена. Возможно, вы перешли по устаревшей ссылке или ввели неправильный адрес."
      onReturnHome={onReturnHome}
      showReturnButton={true}
    />
  );
}; 