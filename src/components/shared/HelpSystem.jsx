import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HelpSystem({ 
  articles = [],
  searchable = true
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const selected = articles.find(a => a.id === selectedId);
  
  const filtered = searchable
    ? articles.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : articles;

  if (!expanded) {
    return (
      <Button
        onClick={() => setExpanded(true)}
        size="icon"
        className="fixed bottom-6 right-6 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 h-12 w-12"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 w-96 max-h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-slate-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Hilfe & Support</h3>
        <Button
          onClick={() => {
            setExpanded(false);
            setSelectedId(null);
          }}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="p-4">
            <button
              onClick={() => setSelectedId(null)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mb-4"
            >
              ← Zurück
            </button>
            <h4 className="font-semibold text-slate-900 mb-3">{selected.title}</h4>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.content}</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {searchable && (
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            )}
            {filtered.map(article => (
              <button
                key={article.id}
                onClick={() => setSelectedId(article.id)}
                className="w-full text-left p-3 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-medium text-slate-900">{article.title}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}