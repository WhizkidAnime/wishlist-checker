import React, { ReactNode } from 'react';
import { Tooltip } from './Tooltip';
import { useIsMobile } from '../../hooks/useIsMobile';

interface DesktopOnlyTooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  className?: string;
  usePortal?: boolean;
}

export const DesktopOnlyTooltip: React.FC<DesktopOnlyTooltipProps> = ({ 
  content, 
  children, 
  delay,
  position = 'auto',
  className,
  usePortal = true
}) => {
  const isMobile = useIsMobile();

  // На мобильных устройствах просто возвращаем children без Tooltip
  if (isMobile) {
    return <>{children}</>;
  }

  // На десктопе показываем полноценный Tooltip
  return (
    <Tooltip
      content={content}
      delay={delay}
      position={position}
      className={className}
      usePortal={usePortal}
    >
      {children}
    </Tooltip>
  );
}; 