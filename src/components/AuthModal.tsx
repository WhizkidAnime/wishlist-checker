import React from 'react';
import { AuthForm } from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-card rounded-3xl p-6 max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto">
        <AuthForm onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
}; 