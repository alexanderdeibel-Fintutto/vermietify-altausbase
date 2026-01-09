import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminLayout({ children, currentPageName }) {
  return (
    <>
      <style>{`
        * {
          font-family: 'Roboto Mono', monospace !important;
          font-weight: 300;
          letter-spacing: 0.5px;
        }
        
        body {
          background-color: #fafafa;
          color: #1a1a1a;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-weight: 300;
          letter-spacing: 1px;
        }
        
        button {
          font-weight: 300;
          letter-spacing: 0.5px;
        }
        
        input, textarea, select {
          font-family: 'Roboto Mono', monospace;
          font-weight: 300;
        }
      `}</style>

      <div className="min-h-screen bg-slate-50">
        {/* Admin Header */}
        <header className="sticky top-16 z-40 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-light tracking-widest text-slate-500">ADMIN PANEL</span>
              <h2 className="text-lg font-light text-slate-900 mt-1">{currentPageName}</h2>
            </div>
            <Link to={createPageUrl('UserSettings')}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </main>
      </div>
    </>
  );
}