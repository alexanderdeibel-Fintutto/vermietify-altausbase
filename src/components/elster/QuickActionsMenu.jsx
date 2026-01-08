import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Zap, FileText, Upload, Search, Download, Archive, TestTube, Sparkles } from 'lucide-react';

export default function QuickActionsMenu({ onAction }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="w-4 h-4" />
          Schnellaktionen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onAction('create')}>
          <FileText className="w-4 h-4 mr-2" />
          Neues Formular
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('search')}>
          <Search className="w-4 h-4 mr-2" />
          Submissions durchsuchen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('upload-cert')}>
          <Upload className="w-4 h-4 mr-2" />
          Zertifikat hochladen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('test-cert')}>
          <TestTube className="w-4 h-4 mr-2" />
          Verbindung testen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('bulk-export')}>
          <Download className="w-4 h-4 mr-2" />
          Bulk-Export
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('archive-old')}>
          <Archive className="w-4 h-4 mr-2" />
          Alte Formulare archivieren
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('optimize')}>
          <Sparkles className="w-4 h-4 mr-2" />
          Optimierungen analysieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}