import React from 'react';
import { Toaster } from 'sonner';

export default function ToastNotificationCenter() {
  return (
    <Toaster 
      position="bottom-right"
      expand={false}
      richColors
      closeButton
    />
  );
}