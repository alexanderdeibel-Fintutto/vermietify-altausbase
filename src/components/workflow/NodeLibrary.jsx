import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Plus, FileText, CheckCircle2, Clock, GitBranch } from 'lucide-react';

export default function NodeLibrary({ onAddNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Schritt hinzufügen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Actions */}
        <DropdownMenuLabel className="text-xs font-semibold text-slate-600">
          Aktionen
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddNode('action', 'create_task')}>
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          <span>Aufgabe erstellen</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddNode('action', 'send_notification')}>
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          <span>Benachrichtigung senden</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddNode('action', 'assign_task')}>
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          <span>Aufgabe zuweisen</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddNode('action', 'add_tag')}>
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          <span>Tag hinzufügen</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddNode('action', 'archive_document')}>
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          <span>Dokument archivieren</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Approval */}
        <DropdownMenuLabel className="text-xs font-semibold text-slate-600">
          Genehmigung
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddNode('approval', null)}>
          <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
          <span>Genehmigungsschritt</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logic */}
        <DropdownMenuLabel className="text-xs font-semibold text-slate-600">
          Logik
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddNode('condition', null)}>
          <GitBranch className="w-4 h-4 mr-2 text-purple-600" />
          <span>Bedingung</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddNode('delay', null)}>
          <Clock className="w-4 h-4 mr-2 text-orange-600" />
          <span>Verzögerung</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}