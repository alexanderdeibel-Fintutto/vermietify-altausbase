import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Check } from 'lucide-react';

export default function ModuleUpsellButton({ moduleName, moduleDisplayName, variant = "default" }) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <Button variant={variant} onClick={() => setOpen(true)} className="gap-2">
                <Star className="w-4 h-4" />
                Modul hinzubuchen
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Modul hinzufügen</DialogTitle>
                        <DialogDescription>
                            Erweitern Sie Ihre Suite mit zusätzlichen Modulen
                        </DialogDescription>
                    </DialogHeader>

                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{moduleDisplayName}</h3>
                                    <Badge className="mt-2">Premium</Badge>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-slate-600">Vorteile:</p>
                                    <ul className="space-y-1">
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-600" />
                                            Vollständiger Zugriff auf alle Funktionen
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-600" />
                                            Automatische Updates
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-600" />
                                            Premium Support
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-4 border-t">
                                    <p className="text-sm text-slate-600 mb-4">
                                        Kontaktieren Sie uns für ein individuelles Angebot.
                                    </p>
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        Anfrage senden
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>
        </>
    );
}