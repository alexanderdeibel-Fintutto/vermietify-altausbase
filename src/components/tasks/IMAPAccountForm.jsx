import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';

export default function IMAPAccountForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: initialData || {
            imap_port: 993,
            use_ssl: true,
            is_active: true
        }
    });

    useEffect(() => {
        if (open) {
            reset(initialData || {
                imap_port: 993,
                use_ssl: true,
                is_active: true
            });
        }
    }, [open, initialData, reset]);

    const useSSL = watch('use_ssl');
    const isActive = watch('is_active');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'IMAP-Konto bearbeiten' : 'Neues IMAP-Konto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            {...register('name', { required: true })}
                            placeholder="z.B. Hausverwaltung Email"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="email_address">Email-Adresse *</Label>
                        <Input
                            id="email_address"
                            type="email"
                            {...register('email_address', { required: true })}
                            placeholder="name@example.com"
                            className={errors.email_address ? 'border-red-500' : ''}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="imap_server">IMAP-Server *</Label>
                            <Input
                                id="imap_server"
                                {...register('imap_server', { required: true })}
                                placeholder="imap.example.com"
                                className={errors.imap_server ? 'border-red-500' : ''}
                            />
                        </div>
                        <div>
                            <Label htmlFor="imap_port">Port *</Label>
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
                            placeholder="Meist die Email-Adresse"
                            className={errors.username ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="password_encrypted">Passwort *</Label>
                        <Input
                            id="password_encrypted"
                            type="password"
                            {...register('password_encrypted', { required: !initialData })}
                            placeholder={initialData ? "Leer lassen für keine Änderung" : "Email-Passwort"}
                            className={errors.password_encrypted ? 'border-red-500' : ''}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Wird verschlüsselt gespeichert
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="use_ssl"
                                checked={useSSL}
                                onCheckedChange={(checked) => setValue('use_ssl', checked)}
                            />
                            <label
                                htmlFor="use_ssl"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                SSL/TLS verwenden (empfohlen)
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={isActive}
                                onCheckedChange={(checked) => setValue('is_active', checked)}
                            />
                            <label
                                htmlFor="is_active"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Konto aktivieren
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
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
                            {initialData ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}