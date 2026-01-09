import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Roboto Mono, monospace' }}>
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-300">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-light text-slate-900">ADMIN</span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-xs font-light text-slate-600">{currentPageName || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('UserSettings')}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-600 hover:text-slate-900 h-8"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="p-6 max-w-[1600px] mx-auto">
        <div className="space-y-6">
          {children}
        </div>
      </main>

      <style>{`
        * {
          font-family: 'Roboto Mono', monospace !important;
        }
        body {
          font-weight: 300;
          font-size: 13px;
          line-height: 1.5;
          color: #1a1a1a;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: 300;
          letter-spacing: 0.5px;
        }
        button {
          font-weight: 300;
        }
        input, textarea, select {
          font-family: 'Roboto Mono', monospace;
          font-weight: 300;
        }
      `}</style>
    </div>
  );
}