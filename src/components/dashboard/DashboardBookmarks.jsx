import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bookmark, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DashboardBookmarks() {
  const bookmarks = [
    { title: 'Meine Objekte', page: 'Buildings', icon: '🏢' },
    { title: 'Mietverträge', page: 'Contracts', icon: '📄' },
    { title: 'BK-Abrechnungen', page: 'OperatingCosts', icon: '💰' },
    { title: 'Anlage V', page: 'AnlageVDashboard', icon: '📊' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          Schnellzugriff
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {bookmarks.map((bookmark) => (
            <Link key={bookmark.page} to={createPageUrl(bookmark.page)}>
              <div className="p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors cursor-pointer">
                <div className="text-2xl mb-2">{bookmark.icon}</div>
                <div className="text-sm font-medium">{bookmark.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}