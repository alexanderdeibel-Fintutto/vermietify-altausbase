import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DashboardBookmarks() {
  const bookmarks = [
    { id: 1, title: 'Meine Objekte', page: 'Buildings', icon: '🏢' },
    { id: 2, title: 'Offene Rechnungen', page: 'Invoices', icon: '💰' },
    { id: 3, title: 'Neue Verträge', page: 'Contracts', icon: '📄' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          Meine Favoriten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {bookmarks.map((bookmark) => (
            <Link key={bookmark.id} to={createPageUrl(bookmark.page)}>
              <div className="p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg text-center cursor-pointer transition-colors">
                <div className="text-2xl mb-1">{bookmark.icon}</div>
                <div className="text-xs font-medium">{bookmark.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}