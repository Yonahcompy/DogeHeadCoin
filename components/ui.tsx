import React from 'react';

// Button Component
export const Button = ({ children, className = '', ...props }) => (
  <button
    className={`px-4 py-2 rounded-lg transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Input Component
export const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

// Label Component
export const Label = ({ children, className = '', ...props }) => (
  <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}>
    {children}
  </label>
);

// Progress Component
export const Progress = ({ value, max, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

// Card Components
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-gray-500 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

// Alert Components
export const Alert = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-blue-50 text-blue-800 border-blue-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const AlertTitle = ({ children, className = '' }) => (
  <h5 className={`font-medium mb-1 ${className}`}>
    {children}
  </h5>
);

export const AlertDescription = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

// Badge Component
export const Badge = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Dialog Components
export const Dialog = ({ children, open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const DialogHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className = '' }) => (
  <h2 className={`text-xl font-semibold ${className}`}>
    {children}
  </h2>
);

export const DialogDescription = ({ children, className = '' }) => (
  <p className={`text-gray-500 mb-4 ${className}`}>
    {children}
  </p>
);

export const DialogFooter = ({ children, className = '' }) => (
  <div className={`mt-6 flex justify-end space-x-2 ${className}`}>
    {children}
  </div>
); 