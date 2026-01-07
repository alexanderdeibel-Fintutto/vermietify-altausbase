import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSuiteAssignment() {
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedSuite, setSelectedSuite] = useState('');
    const [trialDays, setTrialDays] = useState('');
    const queryClient = useQueryClient();

    const { data: users } = useQuery({
        queryKey: ['all-users'],
        queryFn: () => base44.entities.User.list()
    });

    const { data: suites } = useQuery({
        queryKey: ['all-suites'],
        queryFn: () => base44.entities.AppSuite.list()
    });

    const activateMutation = useMutation({
        mutationFn: async (data) => {
            const response = await base44.functions.invoke('activateSuiteForUser', data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries();
            toast.success(`Suite aktiviert! ${data.modules_granted} Module freigeschaltet.`);
            setSelectedUser('');
            setSelectedSuite('');
            setTrialDays('');
        },
        onError: (error) => {
            toast.error(error.message || 'Fehler beim Aktivieren');
        }
    });

    const handleActivate = () => {
        if (!selectedUser || !selectedSuite) {
            toast.error('Bitte User und Suite auswählen');
            return;
        }

        activateMutation.mutate({
            user_id: selectedUser,
            suite_id: selectedSuite,
            status: trialDays ? 'trial' : 'active',
            trial_days: trialDays ? parseInt(trialDays) : undefined
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Suite einem User zuweisen
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>User auswählen</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger>
                            <SelectValue placeholder="User wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                            {users?.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.full_name} ({user.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Suite auswählen</Label>
                    <Select value={selectedSuite} onValueChange={setSelectedSuite}>
                        <SelectTrigger>
                            <SelectValue placeholder="Suite wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                            {suites?.map((suite) => (
                                <SelectItem key={suite.id} value={suite.id}>
                                    {suite.display_name} ({suite.price_tier})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Trial-Tage (optional)</Label>
                    <Input
                        type="number"
                        placeholder="z.B. 30"
                        value={trialDays}
                        onChange={(e) => setTrialDays(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Leer lassen für sofortige Aktivierung ohne Trial
                    </p>
                </div>

                <Button 
                    onClick={handleActivate} 
                    disabled={activateMutation.isPending || !selectedUser || !selectedSuite}
                    className="w-full"
                >
                    {activateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Suite aktivieren
                </Button>
            </CardContent>
        </Card>
    );
}