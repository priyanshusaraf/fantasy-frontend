# Toast Utility Usage Guide

This document explains how to use the custom toast utility in your Next.js application.

## Basic Usage in React Components

For React components, you can use the `useToast` hook:

```tsx
"use client";

import { useToast } from "@/utils/toast-util";

export default function MyComponent() {
  const { showToast } = useToast();
  
  const handleSuccess = () => {
    showToast("Operation completed successfully", "success");
  };
  
  const handleError = () => {
    showToast("Something went wrong", "error");
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

## Available Toast Types

The toast utility supports four types of notifications:

- `success` - Green styling, for successful operations
- `error` - Red styling, for errors and failures
- `info` - Blue styling, for general information
- `warning` - Yellow styling, for warnings

## Toast Configuration

Toasts automatically dismiss after 5 seconds, but users can also dismiss them manually by clicking the × button.

## Simplified API

For a more concise API, you can import from the simplified `toast.ts` file:

```tsx
"use client";

import { success, error, info, warning } from "@/utils/toast";

export default function MyComponent() {
  const handleSuccess = () => {
    success("Operation completed successfully");
  };
  
  const handleError = () => {
    error("Something went wrong");
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

## Provider Setup

The toast provider is already included in your application's providers. If you need to use it in a custom setup, wrap your components with the `ToastProvider`:

```tsx
import { ToastProvider } from "@/utils/toast-util";

export default function CustomLayout({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

## Using in API Routes or Server Components

For server components or API routes, you'll need to trigger the toast from a client-side component, since toast notifications require client-side JavaScript. 