import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Filter, X } from 'lucide-react';

export default function AdvancedFilters({ filters, onFilterChange, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-slate-600">Suche</Label>
              <Input
                placeholder="Problem suchen..."
                value={filters.search || ''}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Business Priority</Label>
              <Select 
                value={filters.business_priority || 'all'} 
                onValueChange={(val) => onFilterChange({ ...filters, business_priority: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="p1_critical">🔴 P1 Kritisch</SelectItem>
                  <SelectItem value="p2_high">🟠 P2 Hoch</SelectItem>
                  <SelectItem value="p3_medium">🟡 P3 Mittel</SelectItem>
                  <SelectItem value="p4_low">⚪ P4 Niedrig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Business-Bereich</Label>
              <Select 
                value={filters.business_area || 'all'} 
                onValueChange={(val) => onFilterChange({ ...filters, business_area: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="auth_login">🔐 Login/Auth</SelectItem>
                  <SelectItem value="finances">💰 Finanzen</SelectItem>
                  <SelectItem value="objects">🏢 Objekte</SelectItem>
                  <SelectItem value="tenants">👥 Mieter</SelectItem>
                  <SelectItem value="documents">📄 Dokumente</SelectItem>
                  <SelectItem value="taxes">📋 Steuern</SelectItem>
                  <SelectItem value="operating_costs">💸 Betriebskosten</SelectItem>
                  <SelectItem value="reports">📊 Reports</SelectItem>
                  <SelectItem value="dashboard">📈 Dashboard</SelectItem>
                  <SelectItem value="settings">⚙️ Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Problem-Typ</Label>
              <Select 
                value={filters.problem_type || 'all'} 
                onValueChange={(val) => onFilterChange({ ...filters, problem_type: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="functional_bug">🐛 Funktional</SelectItem>
                  <SelectItem value="ux_issue">🎨 UX/Usability</SelectItem>
                  <SelectItem value="performance">⚡ Performance</SelectItem>
                  <SelectItem value="visual_bug">👁️ Visuell</SelectItem>
                  <SelectItem value="data_integrity">📊 Daten</SelectItem>
                  <SelectItem value="security">🔒 Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Status</Label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(val) => onFilterChange({ ...filters, status: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="open">Offen</SelectItem>
                  <SelectItem value="triaged">Triaged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Gelöst</SelectItem>
                  <SelectItem value="verified">Verifiziert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Fix-Aufwand</Label>
              <Select 
                value={filters.fix_effort || 'all'} 
                onValueChange={(val) => onFilterChange({ ...filters, fix_effort: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="quick_fix">⚡ Quick Fix</SelectItem>
                  <SelectItem value="small">🔵 Klein</SelectItem>
                  <SelectItem value="medium">🟡 Mittel</SelectItem>
                  <SelectItem value="large">🟠 Groß</SelectItem>
                  <SelectItem value="epic">🔴 Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600">User-Journey</Label>
              <Select 
                value={filters.user_journey || 'all'} 
                onValueChange={(val) => onFilterChange({ ...filters, user_journey: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="first_login">First Login</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="daily_work">Daily Work</SelectItem>
                  <SelectItem value="monthly_tasks">Monthly Tasks</SelectItem>
                  <SelectItem value="yearly_tasks">Yearly Tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={onReset}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Filter zurücksetzen
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Label className="text-xs text-slate-600">Priority Score Range: {filters.minScore || 0} - {filters.maxScore || 1000}</Label>
            <Slider
              value={[filters.minScore || 0, filters.maxScore || 1000]}
              onValueChange={([min, max]) => onFilterChange({ ...filters, minScore: min, maxScore: max })}
              min={0}
              max={1000}
              step={10}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}