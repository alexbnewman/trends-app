// src/components/common/Loading.tsx
import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'medium', 
  text = 'Loading...',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
      {text && (
        <p className={`text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default Loading;