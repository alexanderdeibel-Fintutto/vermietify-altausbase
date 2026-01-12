import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Plus } from "lucide-react";
import GenerateStatementDialog from "@/components/banking/GenerateStatementDialog";
import GenerateTaxReportDialog from "@/components/banking/GenerateTaxReportDialog";

export default function BankStatementsPage() {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [taxReportOpen, setTaxReportOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const queryClient = useQueryClient();

  const { data: statements = [] } = useQuery({
    queryKey: ["bank_statements"],
    queryFn: () => base44.entities.BankStatement.list('-generated_at', 100)
  });

  const filteredStatements = statements.filter(s => 
    filterType === "all" || s.statement_type === filterType
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kontoauszüge & Reports</h1>
          <p className="text-gray-600 mt-1">PDF, MT940 und Steuer-Übersichten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTaxReportOpen(true)} className="gap-2">
            <FileText className="w-4 h-4" />
            Steuer-Report
          </Button>
          <Button onClick={() => setGenerateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Auszug generieren
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Badge 
          variant={filterType === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilterType("all")}
        >
          Alle ({statements.length})
        </Badge>
        {["monthly", "quarterly", "yearly", "tax_report"].map(type => {
          const count = statements.filter(s => s.statement_type === type).length;
          return count > 0 && (
            <Badge 
              key={type}
              variant={filterType === type ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterType(type)}
            >
              {type.replace("_", " ")} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Statements Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Konto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Zeitraum</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Typ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Format</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Transaktionen</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Erstellt</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStatements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-600">
                    Keine Auszüge gefunden
                  </td>
                </tr>
              ) : (
                filteredStatements.map(statement => (
                  <tr key={statement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono">
                      {statement.bank_account_id?.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {statement.period_start} bis {statement.period_end}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline">
                        {statement.statement_type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="secondary">
                        {statement.format.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {statement.transaction_count} Transaktionen
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(statement.generated_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <GenerateStatementDialog open={generateOpen} onOpenChange={setGenerateOpen} />
      <GenerateTaxReportDialog open={taxReportOpen} onOpenChange={setTaxReportOpen} />
    </div>
  );
}