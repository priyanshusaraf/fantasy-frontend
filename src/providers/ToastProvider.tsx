'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 5000,
        style: {
          background: '#fff',
          color: '#363636',
          fontSize: '14px',
          maxWidth: '500px',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.1), 0 3px 3px rgba(0,0,0,0.05)',
        },
        // Custom success toast style
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
          style: {
            border: '1px solid #D1FAE5',
            padding: '16px',
          },
        },
        // Custom error toast style
        error: {
          duration: 6000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#FFFFFF',
          },
          style: {
            border: '1px solid #FEE2E2',
            padding: '16px',
          },
        },
        // Custom info toast style
        loading: {
          duration: 5000,
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#FFFFFF',
          },
          style: {
            border: '1px solid #DBEAFE',
            padding: '16px',
          },
        },
      }}
    />
  );
} 