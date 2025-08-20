import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading', 
  size = 'medium',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-10 w-10',
    large: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
    {/* Spinner wrapper */}
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} mb-4`}>
      {/* Spinning border */}
      <div className={`absolute inset-0 animate-spin rounded-full border-4 border-white border-opacity-30 border-t-white`} />
      
      {/* Static text inside */}
      <p className="text-white text-opacity-90 text-xs sm:text-sm font-medium text-center">
        {message}
      </p>
    </div>
  </div>
  );
};

export default Loading;
