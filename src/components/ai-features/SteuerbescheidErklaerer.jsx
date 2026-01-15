import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function SteuerbescheidErklaerer() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setImageBase64(base64);
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const erklaere = async () => {
    if (!imageBase64) {
      toast.error('Bitte einen Steuerbescheid hochladen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('erklaereSteuerbescheid', {
        imageBase64,
        imageMediaType: 'image/jpeg'
      });

      if (response.data) {
        setResult(response.data);
        toast.success('Steuerbescheid analysiert!');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>📄 Steuerbescheid-Erklärer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            Steuerbescheid hochladen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
            className="hidden"
          />

          {image && (
            <div className="bg-gray-100 rounded-lg p-3">
              <img
                src={image}
                alt="Steuerbescheid-Vorschau"
                className="w-full max-h-48 object-contain"
              />
            </div>
          )}

          <Button
            onClick={erklaere}
            disabled={loading || !imageBase64}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Wird erklärt...
              </>
            ) : (
              '🔍 Bescheid erklären'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Erklärung deines Steuerbescheids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="mb-2">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 ml-4">{children}</ul>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {result.erklaerung}
              </ReactMarkdown>
            </div>

            {result._meta && (
              <div className="text-xs text-gray-500 pt-4 border-t mt-4">
                ℹ️ Kosten: {result._meta.costEur}€ | Tokens: {result._meta.tokens}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}