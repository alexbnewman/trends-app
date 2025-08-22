// src/components/common/ErrorMessage.tsx
import React from 'react';
import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onDismiss,
  className = '',
  variant = 'error'
}) => {
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationCircleIcon className={`h-5 w-5 ${iconStyles[variant]}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-sm">{message}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 hover:bg-opacity-20 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  variant === 'error' ? 'focus:ring-red-500' :
                  variant === 'warning' ? 'focus:ring-yellow-500' :
                  'focus:ring-blue-500'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;