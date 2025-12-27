import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Lock, Globe, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";

const simpleEncrypt = (text) => {
    return btoa(encodeURIComponent(text));
};

export default function OnlineBankingSetup({ open, onOpenChange, account }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        online_banking_enabled: account?.online_banking_enabled || false,
        banking_url: account?.banking_url || '',
        banking_username: account?.banking_username || '',
        banking_password: '',
        bank_code: account?.bank_code || '',
        auto_sync_enabled: account?.auto_sync_enabled || false
    });

    const [showPassword, setShowPassword] = useState(false);

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const updateData = {
                online_banking_enabled: data.online_banking_enabled,
                banking_url: data.banking_url,
                banking_username: data.banking_username,
                bank_code: data.bank_code,
                auto_sync_enabled: data.auto_sync_enabled
            };

            if (data.banking_password) {
                updateData.banking_password_encrypted = simpleEncrypt(data.banking_password);
            }

            return await base44.entities.BankAccount.update(account.id, updateData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
            toast.success('Online-Banking konfiguriert');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Fehler beim Speichern: ' + error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (formData.online_banking_enabled && !formData.banking_username) {
            toast.error('Bitte geben Sie einen Benutzernamen ein');
            return;
        }

        updateMutation.mutate(formData);
    };

    const bankPresets = [
        { name: 'Sparkasse', url: 'https://banking.sparkasse.de' },
        { name: 'Volksbank', url: 'https://banking.volksbank.de' },
        { name: 'Deutsche Bank', url: 'https://meine.deutsche-bank.de' },
        { name: 'Commerzbank', url: 'https://www.commerzbanking.de' },
        { name: 'ING', url: 'https://banking.ing.de' },
        { name: 'Postbank', url: 'https://banking.postbank.de' },
        { name: 'Andere', url: 'custom' }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Online-Banking einrichten
                    </DialogTitle>
                    <DialogDescription>
                        Verbinden Sie Ihr Bankkonto für automatischen Transaktionsabruf
                    </DialogDescription>
                </DialogHeader>

                <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800">
                        <strong>Hinweis:</strong> Ihre Zugangsdaten werden verschlüsselt gespeichert. 
                        Für die volle Funktionalität benötigen Sie Backend-Funktionen in den App-Einstellungen.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="flex items-center justify-between py-2">
                        <Label htmlFor="online_banking_enabled" className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-500" />
                            Online-Banking aktivieren
                        </Label>
                        <Switch 
                            id="online_banking_enabled"
                            checked={formData.online_banking_enabled}
                            onCheckedChange={(checked) => 
                                setFormData({ ...formData, online_banking_enabled: checked })
                            }
                        />
                    </div>

                    {formData.online_banking_enabled && (
                        <>
                            <div>
                                <Label>Bank auswählen</Label>
                                <Select 
                                    value={formData.banking_url}
                                    onValueChange={(value) => setFormData({ ...formData, banking_url: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Bank auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankPresets.map(bank => (
                                            <SelectItem key={bank.name} value={bank.url}>
                                                {bank.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.banking_url === 'custom' && (
                                <div>
                                    <Label htmlFor="custom_url">Banking-URL</Label>
                                    <Input 
                                        id="custom_url"
                                        type="url"
                                        placeholder="https://..."
                                        onChange={(e) => setFormData({ ...formData, banking_url: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="bank_code">Bankleitzahl</Label>
                                    <Input 
                                        id="bank_code"
                                        placeholder="z.B. 12345678"
                                        value={formData.bank_code}
                                        onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="banking_username">Benutzername *</Label>
                                    <Input 
                                        id="banking_username"
                                        placeholder="Ihr Login"
                                        value={formData.banking_username}
                                        onChange={(e) => setFormData({ ...formData, banking_username: e.target.value })}
                                        required={formData.online_banking_enabled}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="banking_password">Passwort / PIN</Label>
                                <div className="relative">
                                    <Input 
                                        id="banking_password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder={account?.banking_password_encrypted ? "••••••••" : "Passwort eingeben"}
                                        value={formData.banking_password}
                                        onChange={(e) => setFormData({ ...formData, banking_password: e.target.value })}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "Verbergen" : "Anzeigen"}
                                    </Button>
                                </div>
                                {account?.banking_password_encrypted && !formData.banking_password && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Leer lassen, um bestehendes Passwort beizubehalten
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between py-2 bg-slate-50 rounded-lg px-3">
                                <Label htmlFor="auto_sync" className="text-sm">
                                    Automatische Synchronisation (täglich)
                                </Label>
                                <Switch 
                                    id="auto_sync"
                                    checked={formData.auto_sync_enabled}
                                    onCheckedChange={(checked) => 
                                        setFormData({ ...formData, auto_sync_enabled: checked })
                                    }
                                />
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}