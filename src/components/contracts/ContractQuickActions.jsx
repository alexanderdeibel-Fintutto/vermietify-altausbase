import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, FileText, User, Euro } from 'lucide-react';
import { toast } from 'sonner';
import BuchungenGenerierenTooltip from '@/components/shared/BuchungenGenerierenTooltip';

export default function ContractQuickActions({ 
  contract, 
  onGenerateBookings, 
  onGenerateDocument, 
  onTenantChange,
  className = '' 
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button 
        size="sm" 
        onClick={onGenerateBookings}
        className="bg-blue-600 hover:bg-blue-700 gap-1"
      >
        <Zap className="w-3 h-3" />
        Buchungen
        <BuchungenGenerierenTooltip compact />
      </Button>
      
      <Button 
        size="sm" 
        variant="outline"
        onClick={onGenerateDocument}
      >
        <FileText className="w-3 h-3 mr-1" />
        Dokument
      </Button>
      
      <Button 
        size="sm" 
        variant="outline"
        onClick={onTenantChange}
      >
        <User className="w-3 h-3 mr-1" />
        Mieterwechsel
      </Button>
    </div>
  );
}