import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, RotateCcw, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function VersionHistoryViewer({ versions = [], onRestore, onPreview }) {
  const [selectedVersion, setSelectedVersion] = useState(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Versionsverlauf
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versions.map((version, idx) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedVersion === version.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedVersion(version.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    Version {versions.length - idx}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(new Date(version.created_date), { 
                      addSuffix: true, 
                      locale: de 
                    })}
                  </p>
                </div>
                {idx === 0 && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                    Aktuell
                  </span>
                )}
              </div>

              {version.notes && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {version.notes}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>von {version.created_by || 'Unbekannt'}</span>
              </div>

              {selectedVersion === version.id && idx > 0 && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview && onPreview(version);
                    }}
                    className="gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Vorschau
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore && onRestore(version);
                    }}
                    className="gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Wiederherstellen
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {versions.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
            Keine Versionen vorhanden
          </p>
        )}
      </CardContent>
    </Card>
  );
}