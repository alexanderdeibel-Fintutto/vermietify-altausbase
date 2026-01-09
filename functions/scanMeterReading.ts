import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url, building_id } = await req.json();

    // Use AI to extract meter number and reading from image
    const prompt = `Analysiere dieses Zählerfoto und extrahiere folgende Informationen:

1. ZÄHLERNUMMER: Die eindeutige Nummer des Zählers (meist alphanumerisch, z.B. "E12345678" oder "12345678")
2. ZÄHLERSTAND: Der aktuelle Zählerstand (Ziffern auf dem Display)
3. ZÄHLERTYP: Art des Zählers (Strom, Wasser, Gas, Heizung)
4. BILDQUALITÄT: Bewertung der Bildqualität für Erkennung

WICHTIG:
- Zählernummer: Suche nach einer Seriennummer oder ID auf dem Zähler
- Zählerstand: Lese ALLE sichtbaren Ziffern ab (auch Nachkommastellen)
- Ignoriere rote Ziffern bei der Hauptablesung
- Gib geschätzte relative Positionen der erkannten Felder an (0-100% von links/oben)

Antworte im JSON-Format:
{
  "meter_number": "erkannte Zählernummer oder null",
  "reading_value": erkannter Zählerstand als Zahl oder null,
  "meter_type": "electricity|water|gas|heating oder null",
  "confidence": Zahl zwischen 0 und 1 für Erkennungssicherheit,
  "image_quality": {
    "sharpness": Schärfe 0-1,
    "lighting": Beleuchtung 0-1,
    "angle": Winkel OK (0-1)
  },
  "detected_regions": {
    "meter_number_position": {"x": Prozent, "y": Prozent, "width": Prozent, "height": Prozent} oder null,
    "reading_position": {"x": Prozent, "y": Prozent, "width": Prozent, "height": Prozent} oder null
  },
  "notes": "Zusätzliche Hinweise oder Probleme"
}`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      file_urls: [image_url],
      response_json_schema: {
        type: "object",
        properties: {
          meter_number: { type: ["string", "null"] },
          reading_value: { type: ["number", "null"] },
          meter_type: { type: ["string", "null"] },
          confidence: { type: "number" },
          image_quality: {
            type: "object",
            properties: {
              sharpness: { type: "number" },
              lighting: { type: "number" },
              angle: { type: "number" }
            }
          },
          detected_regions: {
            type: "object",
            properties: {
              meter_number_position: {
                type: ["object", "null"],
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" }
                }
              },
              reading_position: {
                type: ["object", "null"],
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" }
                }
              }
            }
          },
          notes: { type: "string" }
        }
      }
    });

    // Try to find matching meter in database
    let meter = null;
    let matchConfidence = 0;

    if (aiResult.meter_number) {
      // Fetch all meters for the building
      const allMeters = await base44.entities.Meter.filter(
        building_id ? { building_id } : {},
        null,
        500
      );

      // Try exact match
      meter = allMeters.find(m => 
        m.meter_number === aiResult.meter_number
      );

      if (meter) {
        matchConfidence = 1.0;
      } else {
        // Try fuzzy match (similar numbers)
        const similarMeters = allMeters.filter(m => {
          if (!m.meter_number) return false;
          const similarity = calculateSimilarity(
            m.meter_number.toLowerCase(),
            aiResult.meter_number.toLowerCase()
          );
          return similarity > 0.7;
        });

        if (similarMeters.length === 1) {
          meter = similarMeters[0];
          matchConfidence = 0.8;
        }
      }
    }

    return Response.json({
      success: true,
      meter_number: aiResult.meter_number,
      reading_value: aiResult.reading_value,
      meter_type: aiResult.meter_type,
      confidence: aiResult.confidence * matchConfidence,
      meter_id: meter?.id || null,
      meter_location: meter ? `${meter.building_name || ''} - ${meter.location || ''}`.trim() : null,
      reading_date: new Date().toISOString().split('T')[0],
      ai_notes: aiResult.notes,
      image_quality: aiResult.image_quality || {},
      detected_regions: aiResult.detected_regions || {},
      suggested_meters: meter ? [] : []
    });

  } catch (error) {
    console.error('Meter scan error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});

// Simple similarity calculation
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}