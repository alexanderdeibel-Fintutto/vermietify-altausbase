import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'real_estate', label: 'Immobilien', emoji: '🏢' },
  { id: 'tenants', label: 'Mieter', emoji: '👥' },
  { id: 'private', label: 'Privat', emoji: '👤' },
  { id: 'wealth', label: 'Vermögen', emoji: '💰' },
  { id: 'business', label: 'Firma', emoji: '💼' },
];

export default function DashboardBookmarks({ activeCategory, onCategoryChange }) {
  const [bookmarks, setBookmarks] = useState([]);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboardBookmarks');
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  const toggleBookmark = (categoryId) => {
    const updated = bookmarks.includes(categoryId)
      ? bookmarks.filter(b => b !== categoryId)
      : [...bookmarks, categoryId];
    setBookmarks(updated);
    localStorage.setItem('dashboardBookmarks', JSON.stringify(updated));
  };

  const isBookmarked = (categoryId) => bookmarks.includes(categoryId);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-light text-slate-900">Häufig genutzte Kategorien</h3>
        <Star className="w-4 h-4 text-slate-400" />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {bookmarks.length === 0 ? (
          <p className="text-xs text-slate-500 col-span-full">Markieren Sie Kategorien mit ★ um schneller darauf zuzugreifen</p>
        ) : null}
        
        {bookmarks.map(categoryId => {
          const cat = CATEGORIES.find(c => c.id === categoryId);
          return (
            <button
              key={categoryId}
              onClick={() => onCategoryChange(categoryId)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-light transition-all',
                activeCategory === categoryId
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              <span>{cat.emoji}</span>
              {cat.label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(categoryId);
                }}
                className="ml-1 hover:opacity-70"
              >
                ★
              </button>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600 mb-2">Alle verfügbaren:</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleBookmark(cat.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                isBookmarked(cat.id)
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              title={isBookmarked(cat.id) ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            >
              {cat.emoji}
              {isBookmarked(cat.id) ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}