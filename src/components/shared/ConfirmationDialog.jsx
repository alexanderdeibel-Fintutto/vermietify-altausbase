import React from 'react';
import ConfirmDialog from './ConfirmDialog';

export default function ConfirmationDialog({ 
  open, 
  onClose, 
  onConfirm,
  title,
  message,
  confirmText,
  variant = 'default'
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={message}
      confirmText={confirmText}
      variant={variant}
    />
  );
}