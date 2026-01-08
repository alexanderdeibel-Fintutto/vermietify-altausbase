import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitBranch, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function VersionHistory({ submission, onRestore }) {
  const versions = submission?.metadata?.versions || [];
  const currentVersion = submission?.metadata?.current_version || 0;

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">Keine Versionen vorhanden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Versionshistorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {versions.reverse().map((version) => (
              <div 
                key={version.version} 
                className={`p-3 border rounded-lg ${
                  version.version === currentVersion ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={version.version === currentVersion ? 'default' : 'outline'}>
                        v{version.version}
                      </Badge>
                      {version.version === currentVersion && (
                        <Badge variant="outline" className="text-xs">Aktuell</Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium">{version.comment}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.user}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(version.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </span>
                    </div>
                    {version.changes && Object.keys(version.changes).length > 0 && (
                      <div className="mt-2 text-xs">
                        <div className="font-medium mb-1">Änderungen:</div>
                        <ul className="list-disc list-inside text-slate-600">
                          {Object.entries(version.changes).map(([key, value]) => (
                            <li key={key}>{key}: {String(value)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {version.version !== currentVersion && onRestore && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRestore(version)}
                    >
                      Wiederherstellen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}