import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportMenu({ reportData, reportType, fileName }) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format) => {
        setIsExporting(true);
        try {
            const response = await base44.functions.invoke('exportReportToFile', {
                report_type: reportType,
                report_data: reportData,
                format: format
            });

            // Create blob and download
            const blob = new Blob([response.data], {
                type: format === 'csv' ? 'text/csv' : 'application/json'
            });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            toast.success(`Report als ${format.toUpperCase()} exportiert`);
        } catch (error) {
            toast.error('Exportfehler: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isExporting || !reportData}
                >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exportiere...' : 'Exportieren'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <Table className="w-4 h-4 mr-2" />
                    Als CSV exportieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Als JSON exportieren
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}