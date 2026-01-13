import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DataExportButton({
  onExport,
  formats = ['CSV', 'Excel', 'PDF'],
  loading = false,
}) {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (format) => {
    setIsLoading(true);
    try {
      await onExport?.(format);
    } finally {
      setIsLoading(false);
    }
  };

  if (formats.length === 1) {
    return (
      <Button
        onClick={() => handleExport(formats[0])}
        disabled={loading || isLoading}
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4 mr-2" />
        )}
        {formats[0]}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={loading || isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          Exportieren
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={isLoading}
          >
            {format}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}