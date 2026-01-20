import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfSelect } from '@/components/shared/VfSelect';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

const themes = [
    { value: 'vermieter', label: 'Vermieter (Standard)' },
    { value: 'mieter', label: 'Mieter' },
    { value: 'b2b', label: 'B2B' },
    { value: 'komfort', label: 'Komfort' },
    { value: 'invest', label: 'Investment' }
];

const colorModes = [
    { value: 'light', label: 'Hell', icon: Sun },
    { value: 'dark', label: 'Dunkel', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
];

export default function SettingsAppearance() {
    const [theme, setTheme] = useState(localStorage.getItem('vf-theme') || 'vermieter');
    const [colorMode, setColorMode] = useState(localStorage.getItem('vf-color-mode') || 'light');

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('vf-theme', newTheme);
        
        // Remove old theme classes
        document.body.classList.remove('theme-vermieter', 'theme-mieter', 'theme-b2b', 'theme-komfort', 'theme-invest');
        
        // Add new theme class
        if (newTheme !== 'vermieter') {
            document.body.classList.add(`theme-${newTheme}`);
        }
        
        showSuccess('Theme aktualisiert');
    };

    const handleColorModeChange = (mode) => {
        setColorMode(mode);
        localStorage.setItem('vf-color-mode', mode);
        
        if (mode === 'dark') {
            document.body.classList.add('dark');
        } else if (mode === 'light') {
            document.body.classList.remove('dark');
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }
        
        showSuccess('Farbmodus aktualisiert');
    };

    return (
        <div className="p-6 max-w-2xl">
            <div className="vf-page-header mb-6">
                <div>
                    <h1 className="vf-page-title">Darstellung</h1>
                    <p className="vf-page-subtitle">Passen Sie das Aussehen der App an</p>
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Theme auswählen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <VfSelect
                            label="Theme"
                            value={theme}
                            onChange={handleThemeChange}
                            options={themes}
                        />
                        
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>Tipp:</strong> Jedes Theme bietet ein optimiertes Erlebnis für verschiedene Nutzergruppen
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Farbmodus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            {colorModes.map((mode) => {
                                const Icon = mode.icon;
                                return (
                                    <button
                                        key={mode.value}
                                        onClick={() => handleColorModeChange(mode.value)}
                                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                                            colorMode === mode.value
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon className="w-6 h-6 mx-auto mb-2" />
                                        <p className="text-sm font-medium">{mode.label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}