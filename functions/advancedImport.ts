import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, file_type } = await req.json();

    // Fetch file content
    const fileResponse = await fetch(file_url);
    const fileContent = await fileResponse.text();

    let result = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    switch (file_type) {
      case 'csv':
        result = await importCSV(base44, fileContent);
        break;
      
      case 'xml':
        result = await importXML(base44, fileContent);
        break;
      
      case 'json':
      case 'zip':
        result = await importBackup(base44, fileContent);
        break;
      
      default:
        return Response.json({ 
          error: `Unsupported file type: ${file_type}` 
        }, { status: 400 });
    }

    return Response.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Advanced Import Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function importCSV(base44, content) {
  const lines = content.split('\n');
  const result = {
    imported: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const fields = line.split(';');
      
      // Parse financial item
      await base44.entities.FinancialItem.create({
        date: fields[0],
        account: fields[1],
        contra_account: fields[2],
        amount: parseFloat(fields[3]),
        description: fields[4],
        reference: fields[5]
      });

      result.imported++;
    } catch (error) {
      result.errors++;
      result.details.push(`Zeile ${i}: ${error.message}`);
    }
  }

  return result;
}

async function importXML(base44, content) {
  // Simplified XML parsing
  const result = {
    imported: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  // In reality, use proper XML parser
  result.details.push('XML-Import ist in Entwicklung');
  
  return result;
}

async function importBackup(base44, content) {
  const result = {
    imported: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  try {
    const backup = JSON.parse(content);

    // Import submissions
    if (backup.submissions) {
      for (const sub of backup.submissions) {
        try {
          await base44.entities.ElsterSubmission.create(sub);
          result.imported++;
        } catch (error) {
          result.errors++;
        }
      }
    }

    // Import financial items
    if (backup.financialItems) {
      for (const item of backup.financialItems) {
        try {
          await base44.entities.FinancialItem.create(item);
          result.imported++;
        } catch (error) {
          result.errors++;
        }
      }
    }

    result.details.push(`${result.imported} Einträge importiert`);
  } catch (error) {
    result.errors++;
    result.details.push(`Backup-Import fehlgeschlagen: ${error.message}`);
  }

  return result;
}