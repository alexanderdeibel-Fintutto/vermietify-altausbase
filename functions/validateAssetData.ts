import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Umfassende Datenvalidierungs-Pipeline
 * Prüft Business-Rules, Plausibilität, Integrität
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asset_id } = await req.json();

    // Asset laden
    const assets = await base44.entities.AssetPortfolio.filter(
      asset_id ? { id: asset_id, user_id: user.id } : { user_id: user.id },
      '',
      5000
    );

    const validationResults = [];
    let totalIssues = 0;

    for (const asset of assets) {
      const issues = {
        id: asset.id,
        name: asset.name,
        errors: [],
        warnings: [],
        score: 100
      };

      // 1. Required Fields
      if (!asset.name || asset.name.trim() === '') {
        issues.errors.push('Name fehlt');
        issues.score -= 20;
      }

      if (!asset.asset_category) {
        issues.errors.push('Kategorie fehlt');
        issues.score -= 20;
      }

      if (!asset.quantity || asset.quantity <= 0) {
        issues.errors.push('Menge ungültig (>0 erforderlich)');
        issues.score -= 30;
      }

      if (!asset.purchase_price || asset.purchase_price <= 0) {
        issues.errors.push('Kaufpreis ungültig (>0 erforderlich)');
        issues.score -= 30;
      }

      if (!asset.current_value || asset.current_value <= 0) {
        issues.errors.push('Aktueller Wert ungültig (>0 erforderlich)');
        issues.score -= 30;
      }

      // 2. Business Logic Checks
      if (!asset.purchase_date) {
        issues.warnings.push('Kaufdatum fehlt');
        issues.score -= 10;
      }

      if (asset.purchase_date && new Date(asset.purchase_date) > new Date()) {
        issues.errors.push('Kaufdatum liegt in der Zukunft');
        issues.score -= 25;
      }

      // 3. Plausibility Checks
      if (asset.purchase_price > asset.current_value * 10) {
        issues.warnings.push('Kaufpreis deutlich über aktuellem Wert (>10x)');
        issues.score -= 15;
      }

      if (asset.quantity > 1000000) {
        issues.warnings.push('Außergewöhnlich hohe Menge');
        issues.score -= 10;
      }

      // 4. Documentation Checks
      if (!asset.notes || asset.notes.trim() === '') {
        issues.warnings.push('Keine Notizen/Dokumentation vorhanden');
        issues.score -= 5;
      }

      if (asset.documents && asset.documents.length === 0) {
        issues.warnings.push('Keine Belege hochgeladen');
        issues.score -= 10;
      }

      // 5. ISIN/WKN für Wertpapiere
      if (['stocks', 'bonds', 'funds'].includes(asset.asset_category)) {
        if (!asset.isin && !asset.wkn) {
          issues.warnings.push('ISIN/WKN fehlt - Live-Kurs-Sync nicht möglich');
          issues.score -= 15;
        }
      }

      // 6. Update Freshness
      if (asset.last_updated) {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(asset.last_updated).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceUpdate > 30) {
          issues.warnings.push(`Kursdaten veraltet (${daysSinceUpdate} Tage)`);
          issues.score -= 20;
        }
      } else if (asset.status === 'active') {
        issues.warnings.push('Kursdaten nie aktualisiert');
        issues.score -= 20;
      }

      // Ensure score between 0-100
      issues.score = Math.max(0, Math.min(100, issues.score));
      totalIssues += issues.errors.length + issues.warnings.length;

      validationResults.push(issues);

      // Validation Status speichern
      let validationStatus = 'validated';
      if (issues.errors.length > 0) {
        validationStatus = 'error';
      } else if (issues.warnings.length > 0) {
        validationStatus = 'validated';
      }

      await base44.entities.AssetPortfolio.update(asset.id, {
        validation_status: validationStatus,
        validation_errors: [...issues.errors, ...issues.warnings]
      });

      // Activity Log
      if (issues.errors.length > 0 || issues.warnings.length > 0) {
        await base44.entities.ActivityLog.create({
          user_id: user.id,
          action: 'asset_updated',
          entity_type: 'AssetPortfolio',
          entity_id: asset.id,
          details: {
            validation_score: issues.score,
            errors: issues.errors,
            warnings: issues.warnings
          },
          status: validationStatus
        });
      }
    }

    const overallScore = assets.length > 0
      ? Math.round(
          validationResults.reduce((sum, r) => sum + r.score, 0) / assets.length
        )
      : 100;

    return Response.json({
      success: true,
      overall_score: overallScore,
      total_assets: assets.length,
      total_issues: totalIssues,
      validation_results: validationResults,
      recommendations: generateRecommendations(validationResults)
    });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

function generateRecommendations(results) {
  const recommendations = [];

  const assetsWithErrors = results.filter(r => r.errors.length > 0);
  if (assetsWithErrors.length > 0) {
    recommendations.push({
      type: 'critical',
      message: `${assetsWithErrors.length} Asset(s) haben kritische Fehler - bitte korrigieren`,
      action: 'fix_errors'
    });
  }

  const missingISIN = results.filter(r => 
    r.warnings.some(w => w.includes('ISIN/WKN'))
  );
  if (missingISIN.length > 0) {
    recommendations.push({
      type: 'warning',
      message: `${missingISIN.length} Wertpapier(e) ohne ISIN/WKN - Live-Kurs-Sync nicht möglich`,
      action: 'add_isin'
    });
  }

  const staleData = results.filter(r =>
    r.warnings.some(w => w.includes('veraltet'))
  );
  if (staleData.length > 0) {
    recommendations.push({
      type: 'info',
      message: `${staleData.length} Asset(s) mit veralteten Kursen - Aktualisierung empfohlen`,
      action: 'sync_prices'
    });
  }

  return recommendations;
}