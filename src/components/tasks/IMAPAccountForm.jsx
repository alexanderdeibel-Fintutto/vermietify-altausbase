import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';

export default function IMAPAccountForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || {
            use_ssl: true,
            imap_port: 993,
            is_active: true
        }
    });

    useEffect(() => {
        if (open) {
            reset(initialData || {
                use_ssl: true,
                imap_port: 993,
                is_active: true
            });
        }
    }, [open, initialData, reset]);

    const useSsl = watch('use_ssl');

    const handleFormSubmit = (data) => {
        onSubmit(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'IMAP-Konto bearbeiten' : 'Neues IMAP-Konto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Kontoname *</Label>
                        <Input
                            id="name"
                            {...register('name', { required: true })}
                            placeholder="z.B. Hauptpostfach"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="email_address">Email-Adresse *</Label>
                        <Input
                            id="email_address"
                            type="email"
                            {...register('email_address', { required: true })}
                            placeholder="info@example.com"
                            className={errors.email_address ? 'border-red-500' : ''}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="imap_server">IMAP-Server *</Label>
                            <Input
                                id="imap_server"
                                {...register('imap_server', { required: true })}
                                placeholder="imap.gmail.com"
                                className={errors.imap_server ? 'border-red-500' : ''}
                            />
                        </div>

                        <div>
                            <Label htmlFor="imap_port">IMAP-Port *</Label>
                            <Input
                                id="imap_port"
                                type="number"
                                {...register('imap_port', { required: true })}
                                placeholder="993"
                                className={errors.imap_port ? 'border-red-500' : ''}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="username">Benutzername *</Label>
                        <Input
                            id="username"
                            {...register('username', { required: true })}
                            placeholder="Benutzername"
                            className={errors.username ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="password_encrypted">Passwort *</Label>
                        <Input
                            id="password_encrypted"
                            type="password"
                            {...register('password_encrypted', { required: !initialData })}
                            placeholder={initialData ? "Leer lassen, um nicht zu ändern" : "Passwort"}
                            className={errors.password_encrypted ? 'border-red-500' : ''}
                        />
                        {initialData && (
                            <p className="text-xs text-slate-500 mt-1">
                                Leer lassen, um das bestehende Passwort beizubehalten
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <div className="space-y-1">
                            <Label htmlFor="use_ssl">SSL verwenden</Label>
                            <p className="text-xs text-slate-500">
                                Empfohlen für sichere Verbindung
                            </p>
                        </div>
                        <Switch
                            id="use_ssl"
                            checked={useSsl}
                            onCheckedChange={(checked) => setValue('use_ssl', checked)}
                        />
                    </div>

                    <div className="border-t border-slate-200 pt-4 mt-4">
                        <h3 className="font-medium text-slate-900 mb-3">Datenschutz-Einstellungen</h3>
                        
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="ai_analysis_enabled"
                                    {...register('ai_analysis_enabled')}
                                    className="rounded border-slate-300"
                                />
                                <Label htmlFor="ai_analysis_enabled" className="font-normal cursor-pointer">
                                    KI-Analyse für Task-Vorschläge aktivieren (Opt-in)
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="auto_delete_processed"
                                    {...register('auto_delete_processed')}
                                    className="rounded border-slate-300"
                                />
                                <Label htmlFor="auto_delete_processed" className="font-normal cursor-pointer">
                                    Verarbeitete Emails automatisch löschen
                                </Label>
                            </div>

                            <div>
                                <Label htmlFor="delete_after_days">Emails löschen nach (Tage)</Label>
                                <Input
                                    id="delete_after_days"
                                    type="number"
                                    {...register('delete_after_days')}
                                    placeholder="30"
                                    min="1"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Verarbeitete Emails werden nach dieser Zeit automatisch gelöscht
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800">
                                <strong>Datenschutz:</strong> Ohne KI-Analyse werden Emails nur gespeichert, 
                                aber nicht automatisch verarbeitet. Sie können manuell Tasks erstellen.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? 'Speichern' : 'Hinzufügen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}