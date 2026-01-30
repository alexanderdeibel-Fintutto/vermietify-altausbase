import React from 'react';

export default function LabeledValue({ label, value, copyable = false }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {copied ? 'Kopiert!' : 'Kopieren'}
          </button>
        )}
      </div>
    </div>
  );
}