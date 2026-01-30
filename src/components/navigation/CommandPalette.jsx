import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Plus, FileText, Building2, Users, Settings, BarChart3, DollarSign } from 'lucide-react';

const COMMANDS = [
  { id: '1', label: 'Dashboard', page: 'Dashboard', icon: BarChart3 },
  { id: '2', label: 'Gebäude', page: 'Buildings', icon: Building2 },
  { id: '3', label: 'Mieter', page: 'Tenants', icon: Users },
  { id: '4', label: 'Dokumente', page: 'DocumentManagement', icon: FileText },
  { id: '5', label: 'Abrechnungen', page: 'OperatingCosts', icon: DollarSign },
  { id: '6', label: 'Einstellungen', page: 'Settings', icon: Settings },
  { id: '7', label: 'Neues Gebäude', action: 'create_building', icon: Plus },
  { id: '8', label: 'Neuer Mieter', action: 'create_tenant', icon: Plus },
  { id: '9', label: 'Neues Dokument', action: 'upload_document', icon: Plus },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  // Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = useCallback((cmd) => {
    if (cmd.page) {
      navigate(createPageUrl(cmd.page));
    } else if (cmd.action) {
      // Dispatch custom event for actions
      window.dispatchEvent(new CustomEvent('commandPaletteAction', { detail: { action: cmd.action } }));
    }
    setOpen(false);
    setValue('');
  }, [navigate]);

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <>
      {/* Keyboard hint */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Suchen...</span>
        <kbd className="text-xs font-semibold text-gray-500">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group]:overflow-hidden [&_[cmdk-group]]:px-1 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                placeholder="Seiten, Aktionen, Einstellungen..."
                value={value}
                onValueChange={setValue}
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto">
              <Command.Empty className="py-6 text-center text-sm">
                Keine Ergebnisse gefunden
              </Command.Empty>

              <Command.Group heading="Navigation">
                {filtered.filter(c => c.page).map(cmd => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.label}
                      onSelect={() => handleSelect(cmd)}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {cmd.label}
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <Command.Group heading="Schnellaktionen">
                {filtered.filter(c => c.action).map(cmd => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.label}
                      onSelect={() => handleSelect(cmd)}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {cmd.label}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}