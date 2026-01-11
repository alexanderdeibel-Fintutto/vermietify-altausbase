import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, CheckCircle, Gift } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AutomatedContractWorkflow({ companyId }) {
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [monthlyRent, setMonthlyRent] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [workflowStep, setWorkflowStep] = useState(0);
  const queryClient = useQueryClient();

  const { data: applicants = [] } = useQuery({
    queryKey: ['approved-applicants', companyId],
    queryFn: () => base44.asServiceRole.entities.Applicant.filter({ 
      company_id: companyId, 
      status: 'approved' 
    })
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['contract-templates', companyId],
    queryFn: () => base44.asServiceRole.entities.DocumentTemplate.filter({ 
      company_id: companyId,
      category: 'contract' 
    })
  });

  const generateContractMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('generateContractFromApplicant', {
        applicant_id: selectedApplicant.id,
        template_id: templates[0]?.id,
        move_in_date: moveInDate,
        monthly_rent: parseFloat(monthlyRent),
        deposit_amount: parseFloat(depositAmount)
      }),
    onSuccess: (data) => {
      setWorkflowStep(1);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      return data;
    }
  });

  const sendSignatureMutation = useMutation({
    mutationFn: (documentId) =>
      base44.functions.invoke('sendContractForSignature', { document_id: documentId }),
    onSuccess: () => setWorkflowStep(2)
  });

  const processSignedMutation = useMutation({
    mutationFn: (documentId) =>
      base44.functions.invoke('processSignedContract', { document_id: documentId }),
    onSuccess: (data) => {
      setWorkflowStep(3);
      return data;
    }
  });

  const sendWelcomeMutation = useMutation({
    mutationFn: ({ tenantId, contractId }) =>
      base44.functions.invoke('sendTenantWelcomePackage', { 
        tenant_id: tenantId, 
        contract_id: contractId 
      }),
    onSuccess: () => {
      setWorkflowStep(4);
      setTimeout(() => {
        setWorkflowStep(0);
        setSelectedApplicant(null);
        setMonthlyRent('');
        setDepositAmount('');
        setMoveInDate('');
      }, 3000);
    }
  });

  const steps = [
    { name: 'Vertrag generieren', icon: FileText },
    { name: 'Zur Signatur senden', icon: Send },
    { name: 'Daten erstellen', icon: CheckCircle },
    { name: 'Willkommenspaket', icon: Gift }
  ];

  const executeWorkflow = async () => {
    try {
      // Step 1: Generate contract
      const contractResult = await generateContractMutation.mutateAsync();
      const documentId = contractResult.data.document_id;

      // Step 2: Send for signature
      await sendSignatureMutation.mutateAsync(documentId);

      // Step 3: Process signed contract (simulate signature)
      const signedResult = await processSignedMutation.mutateAsync(documentId);
      
      // Step 4: Send welcome package
      await sendWelcomeMutation.mutateAsync({
        tenantId: signedResult.data.tenant_id,
        contractId: signedResult.data.contract_id
      });
    } catch (error) {
      console.error('Workflow error:', error);
    }
  };

  if (!selectedApplicant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automatisierter Vertragsabschluss</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {applicants.map(app => (
            <div 
              key={app.id} 
              onClick={() => setSelectedApplicant(app)}
              className="p-3 border rounded cursor-pointer hover:bg-slate-50"
            >
              <p className="text-sm font-medium">{app.first_name} {app.last_name}</p>
              <p className="text-xs text-slate-600">Score: {app.credit_score}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Workflow: {selectedApplicant.first_name} {selectedApplicant.last_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <Progress value={(workflowStep / steps.length) * 100} className="h-2" />
          <div className="flex justify-between text-xs">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-1">
                  <Icon className={`w-3 h-3 ${i <= workflowStep ? 'text-green-600' : 'text-slate-400'}`} />
                  <span className={i <= workflowStep ? 'text-green-600' : 'text-slate-400'}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {workflowStep === 0 && (
          <div className="space-y-3">
            <Input
              type="date"
              placeholder="Einzugsdatum"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Monatliche Miete (€)"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Kaution (€)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <Button
              onClick={executeWorkflow}
              disabled={!moveInDate || !monthlyRent || !depositAmount}
              className="w-full"
            >
              Workflow starten
            </Button>
          </div>
        )}

        {workflowStep === 4 && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">Abschluss erfolgreich!</p>
            <p className="text-xs text-slate-600 mt-1">Alle Einträge wurden erstellt.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}