"use client"

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster 
      position="bottom-right"
      toastOptions={{
        style: {
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        },
      }}
    />
  );
}
