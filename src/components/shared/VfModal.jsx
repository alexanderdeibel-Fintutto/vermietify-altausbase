import React from 'react';
import { VfDialog } from '@/components/ui/vf-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VfModal({ 
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeButton = true
}) {
  return (
    <VfDialog open={open} onOpenChange={onOpenChange} size={size}>
      <div className="vf-dialog-content">
        {closeButton && (
          <button 
            onClick={() => onOpenChange(false)}
            className="vf-modal-close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        <div className="vf-dialog-header">
          <h2 className="vf-dialog-title">{title}</h2>
          {description && <p className="vf-dialog-description">{description}</p>}
        </div>
        
        <div className="vf-dialog-body">
          {children}
        </div>
        
        {footer && (
          <div className="vf-dialog-footer">
            {footer}
          </div>
        )}
      </div>
    </VfDialog>
  );
}