import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Check, X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const user = await base44.auth.me();
            return base44.entities.Notification.filter({ 
                user_id: user.id 
            }, '-created_date', 50);
        },
        refetchInterval: 30000 // Alle 30 Sekunden aktualisieren
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsReadMutation = useMutation({
        mutationFn: (id) => base44.entities.Notification.update(id, {
            is_read: true,
            read_at: new Date().toISOString()
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const deleteNotificationMutation = useMutation({
        mutationFn: (id) => base44.entities.Notification.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Benachrichtigung gelöscht');
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const unread = notifications.filter(n => !n.is_read);
            await Promise.all(
                unread.map(n => base44.entities.Notification.update(n.id, {
                    is_read: true,
                    read_at: new Date().toISOString()
                }))
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Alle als gelesen markiert');
        }
    });

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
            default: return <Info className="w-4 h-4 text-blue-600" />;
        }
    };

    const getColorClass = (type) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'error': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-amber-50 border-amber-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-slate-800">Benachrichtigungen</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Alle gelesen
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>Keine Benachrichtigungen</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-slate-50 transition-colors ${
                                        !notification.is_read ? 'bg-blue-50/50' : ''
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-medium text-slate-800 text-sm">
                                                    {notification.title}
                                                </h4>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 -mt-1"
                                                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs text-slate-500">
                                                    {format(parseISO(notification.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                </span>
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs"
                                                        onClick={() => markAsReadMutation.mutate(notification.id)}
                                                    >
                                                        Als gelesen markieren
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}