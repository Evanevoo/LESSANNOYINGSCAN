import React from 'react';

const Input = ({ 
  className = '', 
  type = 'text',
  disabled = false,
  ...props 
}) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled}
      {...props}
    />
  );
};

export { Input }; 