import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, Edit, Archive, Tag, CheckSquare, X, 
  Copy, Download, Mail, MoreHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SmartBulkActionsBar({ 
  selectedCount = 0,
  onClearSelection,
  onDelete,
  onEdit,
  onArchive,
  onTag,
  onExport,
  onDuplicate,
  onEmail,
  customActions = []
}) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <Card className="shadow-2xl border-slate-300">
          <div className="flex items-center gap-4 px-6 py-4">
            {/* Selection Count */}
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600 text-white px-3 py-1">
                {selectedCount} ausgewählt
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-8 w-px bg-slate-300" />

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(onEdit)}
                  disabled={loading}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </Button>
              )}

              {onTag && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(onTag)}
                  disabled={loading}
                  className="gap-2"
                >
                  <Tag className="w-4 h-4" />
                  Tag
                </Button>
              )}

              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(onExport)}
                  disabled={loading}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MoreHorizontal className="w-4 h-4" />
                    Mehr
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onDuplicate && (
                    <DropdownMenuItem onClick={() => handleAction(onDuplicate)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplizieren
                    </DropdownMenuItem>
                  )}
                  
                  {onArchive && (
                    <DropdownMenuItem onClick={() => handleAction(onArchive)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archivieren
                    </DropdownMenuItem>
                  )}

                  {onEmail && (
                    <DropdownMenuItem onClick={() => handleAction(onEmail)}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email senden
                    </DropdownMenuItem>
                  )}

                  {customActions.map((action) => (
                    <DropdownMenuItem 
                      key={action.id}
                      onClick={() => handleAction(action.onClick)}
                    >
                      {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}

                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleAction(onDelete)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Löschen
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}