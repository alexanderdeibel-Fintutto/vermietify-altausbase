import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

export default function DocumentClassificationRuleBuilder({ companyId }) {
  const [ruleName, setRuleName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [autoTags, setAutoTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.DocumentClassificationRule.create({
        company_id: companyId,
        name: ruleName,
        document_type: documentType,
        keywords,
        auto_tags: autoTags,
        confidence_threshold: 0.7,
        is_active: true
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classification-rules'] });
      resetForm();
    }
  });

  const resetForm = () => {
    setRuleName('');
    setDocumentType('');
    setKeywords([]);
    setAutoTags([]);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput)) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !autoTags.includes(tagInput)) {
      setAutoTags([...autoTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Klassifizierungsregel erstellen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Regelname"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
        />

        <Input
          placeholder="Dokumenttyp (z.B. contract, invoice)"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
        />

        {/* Keywords */}
        <div>
          <label className="text-sm font-medium">Schlüsselwörter</label>
          <div className="flex gap-1 mt-1">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="Stichwort..."
              className="flex-1"
            />
            <Button size="sm" variant="outline" onClick={addKeyword}>
              +
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map(kw => (
                <Badge
                  key={kw}
                  variant="secondary"
                  onClick={() => setKeywords(keywords.filter(k => k !== kw))}
                  className="cursor-pointer"
                >
                  {kw} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Auto Tags */}
        <div>
          <label className="text-sm font-medium">Auto-Tags</label>
          <div className="flex gap-1 mt-1">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Tag..."
              className="flex-1"
            />
            <Button size="sm" variant="outline" onClick={addTag}>
              +
            </Button>
          </div>
          {autoTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {autoTags.map(tag => (
                <Badge
                  key={tag}
                  className="cursor-pointer"
                  onClick={() => setAutoTags(autoTags.filter(t => t !== tag))}
                >
                  {tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={() => createMutation.mutate()}
          disabled={!ruleName || !documentType || keywords.length === 0}
          className="w-full"
        >
          {createMutation.isPending ? 'Erstellt...' : 'Regel erstellen'}
        </Button>
      </CardContent>
    </Card>
  );
}