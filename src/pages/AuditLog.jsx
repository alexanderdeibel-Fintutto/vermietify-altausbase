import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Badge } from '@/components/ui/badge';
import { FileText, Search } from 'lucide-react';

export default function AuditLog() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['auditLogs'],
        queryFn: () => base44.entities.AuditLog.list('-timestamp', 100)
    });

    const filteredLogs = logs.filter(log =>
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Audit Log</h1>
                    <p className="vf-page-subtitle">{logs.length} Einträge</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <VfInput
                        leftIcon={Search}
                        placeholder="Logs durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            {filteredLogs.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600">Keine Logs gefunden</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredLogs.map((log) => (
                        <Card key={log.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={
                                                log.action === 'CREATE' ? 'vf-badge-success' :
                                                log.action === 'UPDATE' ? 'vf-badge-info' :
                                                log.action === 'DELETE' ? 'vf-badge-error' :
                                                'vf-badge-default'
                                            }>
                                                {log.action}
                                            </Badge>
                                            <span className="font-semibold">{log.entity_type}</span>
                                        </div>
                                        {log.change_summary && (
                                            <p className="text-sm text-gray-700 mb-2">{log.change_summary}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>{log.user_email}</span>
                                            <span>•</span>
                                            <span>{new Date(log.timestamp || log.created_date).toLocaleString('de-DE')}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}