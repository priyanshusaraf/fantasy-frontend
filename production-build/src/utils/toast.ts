"use client";

// This file provides a simpler API for showing toasts across the application
// Import this file instead of the full toast-util if you only need to show toasts

import { useToast } from "./toast-util";

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Helper function to show toasts outside of React components
export function toast(message: string, type: ToastType = 'info') {
  // Get the useToast hook from a component that uses it
  const { showToast } = useToast();
  showToast(message, type);
}

// Export the hook for use in React components
export { useToast };

// Export convenience methods for different toast types
export function success(message: string) {
  toast(message, 'success');
}

export function error(message: string) {
  toast(message, 'error');
}

export function info(message: string) {
  toast(message, 'info');
}

export function warning(message: string) {
  toast(message, 'warning');
} 