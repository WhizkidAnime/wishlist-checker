import React from 'react';

interface MobileTooltipModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title?: string;
}

export const MobileTooltipModal: React.FC<MobileTooltipModalProps> = ({ 
  isOpen, 
  onClose, 
  content, 
  title 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-theme-card rounded-2xl max-w-sm w-full">
        <div className="p-6">
          {title && (
            <h3 className="text-lg font-semibold text-theme-primary mb-3">
              {title}
            </h3>
          )}
          
          <p className="text-theme-secondary text-sm leading-relaxed mb-6">
            {content}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 bg-theme-accent text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}; 