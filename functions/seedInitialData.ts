import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if data already exists
        const existingEuerCategories = await base44.asServiceRole.entities.EuerCategory.list();
        const existingCostTypes = await base44.asServiceRole.entities.CostType.list();

        if (existingEuerCategories.length > 0 || existingCostTypes.length > 0) {
            return Response.json({ 
                message: 'Daten existieren bereits. Lösche zuerst die bestehenden Daten, falls gewünscht.',
                skipped: true
            });
        }

        // Create EÜR Categories
        const euerCategoriesData = [
            // Einnahmen
            { name: 'Mieteinnahmen', parent_category: 'Einnahmen aus Vermietung und Verpachtung', is_income: true },
            { name: 'Betriebskosten-Nachzahlungen', parent_category: 'Einnahmen aus Vermietung und Verpachtung', is_income: true },
            { name: 'Sonstige', parent_category: 'Sonstige Einnahmen', is_income: true },
            
            // Ausgaben
            { name: 'Löhne und Gehälter', parent_category: 'Personalkosten', is_income: false },
            { name: 'Sozialabgaben', parent_category: 'Personalkosten', is_income: false },
            { name: 'Miete/Pacht Geschäftsräume', parent_category: 'Raumkosten', is_income: false },
            { name: 'Nebenkosten', parent_category: 'Raumkosten', is_income: false },
            { name: 'Grundsteuer', parent_category: 'Steuern, Versicherungen und Beiträge', is_income: false },
            { name: 'Versicherungen', parent_category: 'Steuern, Versicherungen und Beiträge', is_income: false },
            { name: 'Werbekosten', parent_category: 'Werbe- und Reisekosten', is_income: false },
            { name: 'Reisekosten', parent_category: 'Werbe- und Reisekosten', is_income: false },
            { name: 'Kfz-Kosten', parent_category: 'Kfz-Kosten', is_income: false },
            { name: 'Reparaturen', parent_category: 'Instandhaltung und Werkzeuge', is_income: false },
            { name: 'Werkzeuge', parent_category: 'Instandhaltung und Werkzeuge', is_income: false },
            { name: 'AfA Gebäude', parent_category: 'Abschreibungen', is_income: false },
            { name: 'AfA Bewegliche Wirtschaftsgüter', parent_category: 'Abschreibungen', is_income: false },
            { name: 'GWG (Geringwertige Wirtschaftsgüter)', parent_category: 'Abschreibungen', is_income: false },
            { name: 'Büromaterial', parent_category: 'Büro- und Verwaltungskosten', is_income: false },
            { name: 'Porto', parent_category: 'Büro- und Verwaltungskosten', is_income: false },
            { name: 'Telefon', parent_category: 'Telefon, Post und Internet', is_income: false },
            { name: 'Internet', parent_category: 'Telefon, Post und Internet', is_income: false },
            { name: 'Fachliteratur', parent_category: 'Fachliteratur und Fortbildung', is_income: false },
            { name: 'Fortbildung', parent_category: 'Fachliteratur und Fortbildung', is_income: false },
            { name: 'Leasing', parent_category: 'Mieten und Leasing', is_income: false },
            { name: 'Sollzinsen', parent_category: 'Finanzierungskosten', is_income: false },
            { name: 'Bankgebühren', parent_category: 'Finanzierungskosten', is_income: false },
            { name: 'Rechtsberatung', parent_category: 'Verschiedene Kosten', is_income: false },
            { name: 'Steuerberatung', parent_category: 'Verschiedene Kosten', is_income: false },
            { name: 'Sonstige Kosten', parent_category: 'Verschiedene Kosten', is_income: false },
        ];

        const createdEuerCategories = [];
        for (const data of euerCategoriesData) {
            const created = await base44.asServiceRole.entities.EuerCategory.create(data);
            createdEuerCategories.push(created);
        }

        // Helper function to find EÜR category ID
        const findEuerCategoryId = (name) => {
            const cat = createdEuerCategories.find(c => c.name === name);
            return cat?.id || null;
        };

        // Create Cost Types based on the provided table
        const costTypesData = [
            // Einnahmen - Mieteinnahmen steuerfrei
            { type: 'income', main_category: 'Mieteinnahmen steuerfrei', sub_category: 'Betriebskosten', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Mieteinnahmen'), tax_deductible: false },
            { type: 'income', main_category: 'Mieteinnahmen steuerfrei', sub_category: 'Kautionen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Mieteinnahmen'), tax_deductible: false },
            { type: 'income', main_category: 'Mieteinnahmen steuerfrei', sub_category: 'Miete', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Mieteinnahmen'), tax_deductible: false },
            
            // Einnahmen - Mieteinnahmen Umsatzsteuer
            { type: 'income', main_category: 'Mieteinnahmen Umsatzst.', sub_category: 'Miete', vat_rate: 0.19, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Mieteinnahmen'), tax_deductible: false },
            { type: 'income', main_category: 'Mieteinnahmen Umsatzst.', sub_category: 'Kautionen', vat_rate: 0.19, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Mieteinnahmen'), tax_deductible: false },
            
            // Ausgaben - Betriebskosten
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Algemeinstrom', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Aufzug', vat_rate: 0, distributable: true, distribution_key: 'Personen', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Außenanlagen', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Dachrinnenreinigung', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Eichung oder Austausch Verbrauchserfassung Kaltwasser', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Externe Heizkostenabrechnung', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Feuerversicherungen', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Versicherungen'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Flurbeleuchtung', vat_rate: 0, distributable: true, distribution_key: 'Personen', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Gemeinschaftsantenne', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Grundgebühren Kabelanschluss', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Kaminfeger (Betriebskosten)', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Treppenhausreinigung', vat_rate: 0, distributable: true, distribution_key: 'Personen', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Ungezieferbekämpfung', vat_rate: 0, distributable: true, distribution_key: 'qm', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Betriebskosten', sub_category: 'Winterdienst', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            
            // Ausgaben - Finanzen/Steuern
            { type: 'expense', main_category: 'Finanzen/Steuern', sub_category: 'Bank- und Kontoführungsgebühren', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Bankgebühren'), tax_deductible: false },
            { type: 'expense', main_category: 'Finanzen/Steuern', sub_category: 'Darlehensrate (Zins & Tilgung)', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Sollzinsen'), tax_deductible: false },
            { type: 'expense', main_category: 'Finanzen/Steuern', sub_category: 'Darlehenstilgung', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Sollzinsen'), tax_deductible: false },
            { type: 'expense', main_category: 'Finanzen/Steuern', sub_category: 'Darlehenszinsen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Sollzinsen'), tax_deductible: false },
            { type: 'expense', main_category: 'Finanzen/Steuern', sub_category: 'Kapitalertragssteuer', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Grundsteuer'), tax_deductible: false },
            { type: 'expense', main_category: 'Finanzen/Steuern', sub_category: 'Rechts- und Beratungskosten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Rechtsberatung'), tax_deductible: false },
            { type: 'expense', main_category: 'Finanzen/Steuern', sub_category: 'Sollzinsen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Sollzinsen'), tax_deductible: false },
            
            // Ausgaben - Heizung/Wasser/Strom
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Bedienungskosten', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Betriebsstrom', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Eichung oder Austausch Verbrauchserfassung Heizkosten', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Eichung oder Austausch Verbrauchserfassung Warmwasser', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Emissionsmessung', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Erdgas', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Gaspreisbremse', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Gerätemiete Verbrauchserfassung Heizanlage', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Gerätemiete Verbrauchserfassung Kaltwasser', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Gerätemiete Verbrauchserfassung Raumwärme', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Gerätemiete Verbrauchserfassung Warmwasser', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Immisionsmessung', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Kaminfeger (Heizkosten)', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Kosten der Abgasanlage', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Legionellenprüfung', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Reinigung Heizungsräume', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Sonstige Zusatzkosten Raumwärme', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Strompreisbremse Betriebsstrom', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Unterjährige Verbrauchsinformation', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Versicherung Heizungsanlage', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Versicherungen'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Wartung Heizung', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Wartung Lüftung', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Wartungskosten Heizung', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Heizung/Wasser/Strom', sub_category: 'Zusatzkosten für Warmwasser', vat_rate: 0, distributable: true, distribution_key: 'Verbrauch', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            
            // Ausgaben - Investitionen/Installationen
            { type: 'expense', main_category: 'Investitionen/Installationen', sub_category: 'Anschaffung von Gartengeräten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Werkzeuge'), tax_deductible: false },
            { type: 'expense', main_category: 'Investitionen/Installationen', sub_category: 'Installation Geräte Verbrauchserfassung', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('GWG (Geringwertige Wirtschaftsgüter)'), tax_deductible: false },
            { type: 'expense', main_category: 'Investitionen/Installationen', sub_category: 'Installation von Feuerlöschern', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('GWG (Geringwertige Wirtschaftsgüter)'), tax_deductible: false },
            { type: 'expense', main_category: 'Investitionen/Installationen', sub_category: 'Investitionen Heizung', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('AfA Bewegliche Wirtschaftsgüter'), tax_deductible: false },
            { type: 'expense', main_category: 'Investitionen/Installationen', sub_category: 'Möbel mit Wert <800€', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('GWG (Geringwertige Wirtschaftsgüter)'), tax_deductible: false },
            
            // Ausgaben - Räumung-, Leerstandskosten
            { type: 'expense', main_category: 'Räumung-, Leerstandskosten', sub_category: 'Beseitigung Verstopfung Abwasserrohr', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Räumung-, Leerstandskosten', sub_category: 'Betriebskostenanteile für leerstehende Wohnungen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Räumung-, Leerstandskosten', sub_category: 'Heizkostenkostenanteile für leerstehende Wohnungen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Räumung-, Leerstandskosten', sub_category: 'Strom', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            
            // Ausgaben - Reparaturen/Instandhaltung
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Ersatzteile für Aufzüge', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Kosten für einmaligen Stördienst (Aufzug)', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Reparatur elektrischer Türöffner', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Reparatur Heizung', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Reparatur Reinigungsmaschinen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Reparaturen an Fliesen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Reparaturkosten Heizung', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Schönheitsreparaturen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Sonstige Instandhaltungs-/setzungskosten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Sonstige Reparaturkosten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Wartung Klingelsprechanlage', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reparaturen'), tax_deductible: false },
            { type: 'expense', main_category: 'Reparaturen/Instandhaltung', sub_category: 'Wasserkosten durch Wasserleitungsschäden', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            
            // Ausgaben - sonstiges
            { type: 'expense', main_category: 'sonstiges', sub_category: 'Sonstige Ausgaben (nicht steuerlich absetzbar)', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Sonstige Kosten'), tax_deductible: false },
            { type: 'expense', main_category: 'sonstiges', sub_category: 'Sonstige Ausgaben (steuerlich absetzbar)', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Sonstige Kosten'), tax_deductible: true },
            
            // Ausgaben - Versicherung
            { type: 'expense', main_category: 'Versicherung', sub_category: 'Gebäudehaftpflicht', vat_rate: 0, distributable: true, distribution_key: 'Personen', euer_category_id: findEuerCategoryId('Versicherungen'), tax_deductible: false },
            { type: 'expense', main_category: 'Versicherung', sub_category: 'Glasversicherung', vat_rate: 0, distributable: true, distribution_key: 'Personen', euer_category_id: findEuerCategoryId('Versicherungen'), tax_deductible: false },
            { type: 'expense', main_category: 'Versicherung', sub_category: 'Haftpflichtversicherung', vat_rate: 0, distributable: true, distribution_key: 'Personen', euer_category_id: findEuerCategoryId('Versicherungen'), tax_deductible: false },
            { type: 'expense', main_category: 'Versicherung', sub_category: 'sons. Versicherung', vat_rate: 0, distributable: true, distribution_key: 'Personen', euer_category_id: findEuerCategoryId('Versicherungen'), tax_deductible: false },
            
            // Ausgaben - Verwaltung
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Annoncen', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Werbekosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Anwaltskosten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Rechtsberatung'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Fahrtkosten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Reisekosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Gebühren für Rücklastschrift', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Bankgebühren'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Hausgeld', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Nebenkosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Mitgliedsbeiträge Eigentümerverband', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Sonstige Kosten'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Porto', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Porto'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Steuerberatungskosten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Steuerberatung'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Telefonkosten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Telefon'), tax_deductible: false },
            { type: 'expense', main_category: 'Verwaltung', sub_category: 'Verwaltungskosten', vat_rate: 0, distributable: false, distribution_key: 'none', euer_category_id: findEuerCategoryId('Sonstige Kosten'), tax_deductible: false },
        ];

        let createdCount = 0;
        for (const data of costTypesData) {
            await base44.asServiceRole.entities.CostType.create(data);
            createdCount++;
        }

        return Response.json({ 
            success: true,
            message: `${createdEuerCategories.length} EÜR-Kategorien und ${createdCount} Kostenarten erstellt`,
            euerCategoriesCount: createdEuerCategories.length,
            costTypesCount: createdCount
        });
    } catch (error) {
        console.error('Error seeding data:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});