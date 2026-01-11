import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Search, Highlighter } from 'lucide-react';

export default function DocumentationFulltextSearch({ 
  content = '', 
  onClose 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [matches, setMatches] = useState([]);

  React.useEffect(() => {
    if (!searchTerm.trim()) {
      setMatches([]);
      setCurrentMatch(0);
      return;
    }

    const regex = new RegExp(searchTerm, 'gi');
    const foundMatches = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      foundMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }

    setMatches(foundMatches);
    setCurrentMatch(0);
  }, [searchTerm, content]);

  const highlightedContent = () => {
    if (!searchTerm.trim() || matches.length === 0) return content;

    let result = '';
    let lastIndex = 0;

    matches.forEach((match, idx) => {
      result += content.substring(lastIndex, match.start);
      const isCurrentMatch = idx === currentMatch;
      result += `<mark style="background: ${isCurrentMatch ? '#fbbf24' : '#dbeafe'}; padding: 2px 4px; border-radius: 2px;">${content.substring(match.start, match.end)}</mark>`;
      lastIndex = match.end;
    });

    result += content.substring(lastIndex);
    return result;
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Im Text suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {searchTerm && matches.length > 0 && (
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800">
              {matches.length} Treffer
            </Badge>
            <div className="text-sm text-slate-600">
              Treffer {currentMatch + 1} von {matches.length}
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setCurrentMatch(Math.max(0, currentMatch - 1))}
                disabled={currentMatch === 0}
                className="px-2 py-1 text-sm rounded hover:bg-slate-100 disabled:opacity-50"
              >
                ← Zurück
              </button>
              <button
                onClick={() => setCurrentMatch(Math.min(matches.length - 1, currentMatch + 1))}
                disabled={currentMatch === matches.length - 1}
                className="px-2 py-1 text-sm rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {searchTerm && matches.length === 0 && (
          <div className="text-sm text-slate-500">
            Keine Treffer für "{searchTerm}"
          </div>
        )}

        {/* Highlighted Preview */}
        {searchTerm && (
          <div className="max-h-64 overflow-y-auto bg-slate-50 rounded p-3 border border-slate-200">
            <div
              className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-xs"
              dangerouslySetInnerHTML={{ __html: highlightedContent() }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}