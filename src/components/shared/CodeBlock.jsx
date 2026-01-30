import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useClipboard } from '@/components/hooks/useClipboard';

export default function CodeBlock({ code, language = 'javascript' }) {
  const { copy, copied } = useClipboard();

  return (
    <div className="relative bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400">{language}</span>
        <button
          onClick={() => copy(code)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-gray-100 font-mono">{code}</code>
      </pre>
    </div>
  );
}