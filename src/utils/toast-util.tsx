"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Toast types for styling
type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast interface
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Toast context interface
interface ToastContextProps {
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  dismissToast: (id: string) => void;
}

// Create context with default values
const ToastContext = createContext<ToastContextProps>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

// Custom hook to use toast context
export const useToast = () => useContext(ToastContext);

// Toast provider component
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show a toast
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    
    // Add new toast to the list
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  }, []);

  // Dismiss a toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Toast container component
const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  // If no toasts, don't render the container
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded shadow-lg flex items-start justify-between transition-all duration-300 ${
            // Different styling based on toast type
            toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' :
            toast.type === 'error' ? 'bg-red-50 border-l-4 border-red-500 text-red-700' :
            toast.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700' :
            'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
          }`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}; 