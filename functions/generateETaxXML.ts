import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taxYear, canton } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Generating Swiss eTax XML for ${taxYear} in canton ${canton}`);

    // Fetch all Swiss tax data
    const [investments, realEstates, otherIncomes] = await Promise.all([
      base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [],
      base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [],
      base44.entities.OtherIncomeCH.filter({ tax_year: taxYear, canton }) || []
    ]);

    // Build eTax XML structure (simplified for Swiss format)
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<eTaxDeclaration xmlns="http://www.estv.admin.ch/etax">
  <Header>
    <TaxYear>${taxYear}</TaxYear>
    <Canton>${canton}</Canton>
    <DeclarationVersion>2026.01</DeclarationVersion>
    <DeclarationDate>${new Date().toISOString()}</DeclarationDate>
  </Header>

  <Taxpayer>
    <Name>${user.full_name}</Name>
    <ResidenceCantons>${canton}</ResidenceCantons>
  </Taxpayer>

  <IncomeDeclaration>
    <!-- Wertschriften & Kapitalvermögen -->
    <Securities>
      <Items>
        ${investments.map((inv, idx) => `
        <Security id="${idx + 1}">
          <Description>${inv.title}</Description>
          <ISIN>${inv.isin || 'N/A'}</ISIN>
          <DividendIncome>${(inv.dividend_income || 0).toFixed(2)}</DividendIncome>
          <InterestIncome>${(inv.interest_income || 0).toFixed(2)}</InterestIncome>
          <CapitalGains>${(inv.capital_gains || 0).toFixed(2)}</CapitalGains>
          <CapitalLosses>${(inv.capital_losses || 0).toFixed(2)}</CapitalLosses>
          <WithholdingTaxPaid>${(inv.withholding_tax_paid || 0).toFixed(2)}</WithholdingTaxPaid>
          <UnrealizedGains>${(inv.unrealized_gains || 0).toFixed(2)}</UnrealizedGains>
        </Security>
        `).join('')}
      </Items>
      <Totals>
        <TotalDividends>${investments.reduce((s, i) => s + (i.dividend_income || 0), 0).toFixed(2)}</TotalDividends>
        <TotalInterest>${investments.reduce((s, i) => s + (i.interest_income || 0), 0).toFixed(2)}</TotalInterest>
        <TotalCapitalGains>${investments.reduce((s, i) => s + (i.capital_gains || 0), 0).toFixed(2)}</TotalCapitalGains>
        <TotalWithholding>${investments.reduce((s, i) => s + (i.withholding_tax_paid || 0), 0).toFixed(2)}</TotalWithholding>
      </Totals>
    </Securities>

    <!-- Immobilien -->
    <RealEstate>
      <Properties>
        ${realEstates.map((re, idx) => `
        <Property id="${idx + 1}">
          <Description>${re.title}</Description>
          <Address>${re.address}, ${re.canton}</Address>
          <MarketValue>${(re.current_market_value || 0).toFixed(2)}</MarketValue>
          <TaxValue>${(re.tax_assessed_value || 0).toFixed(2)}</TaxValue>
          <RentalIncome>${(re.rental_income || 0).toFixed(2)}</RentalIncome>
          <Maintenance>${(re.maintenance_costs || 0).toFixed(2)}</Maintenance>
          <MortgageDebt>${(re.mortgage_debt || 0).toFixed(2)}</MortgageDebt>
          <MortgageInterest>${(re.mortgage_interest_deductible || 0).toFixed(2)}</MortgageInterest>
          <PropertyTax>${(re.property_tax || 0).toFixed(2)}</PropertyTax>
          <InsuranceCosts>${(re.insurance_costs || 0).toFixed(2)}</InsuranceCosts>
        </Property>
        `).join('')}
      </Properties>
      <Totals>
        <TotalRealEstateValue>${realEstates.reduce((s, r) => s + (r.current_market_value || 0), 0).toFixed(2)}</TotalRealEstateValue>
        <TotalRentalIncome>${realEstates.reduce((s, r) => s + (r.rental_income || 0), 0).toFixed(2)}</TotalRentalIncome>
        <TotalMortgageDebt>${realEstates.reduce((s, r) => s + (r.mortgage_debt || 0), 0).toFixed(2)}</TotalMortgageDebt>
      </Totals>
    </RealEstate>

    <!-- Sonstige Einkünfte -->
    <OtherIncome>
      <Items>
        ${otherIncomes.map((oi, idx) => `
        <Item id="${idx + 1}">
          <Description>${oi.description}</Description>
          <IncomeType>${oi.income_type}</IncomeType>
          <Amount>${(oi.amount || 0).toFixed(2)}</Amount>
          <WithholdingTaxPaid>${(oi.withholding_tax_paid || 0).toFixed(2)}</WithholdingTaxPaid>
          <DeductibleExpenses>${(oi.deductible_expenses || 0).toFixed(2)}</DeductibleExpenses>
        </Item>
        `).join('')}
      </Items>
      <Totals>
        <TotalOtherIncome>${otherIncomes.reduce((s, oi) => s + (oi.amount || 0), 0).toFixed(2)}</TotalOtherIncome>
      </Totals>
    </OtherIncome>
  </IncomeDeclaration>

  <Metadata>
    <ItemCount>
      <Securities>${investments.length}</Securities>
      <RealEstate>${realEstates.length}</RealEstate>
      <OtherIncome>${otherIncomes.length}</OtherIncome>
    </ItemCount>
  </Metadata>
</eTaxDeclaration>`;

    // Upload XML file
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: xmlContent
    });

    return Response.json({
      success: true,
      file_url,
      fileName: `eTax_${canton}_${taxYear}.xml`,
      taxYear,
      canton,
      dataCount: {
        securities: investments.length,
        realEstate: realEstates.length,
        otherIncome: otherIncomes.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('eTax XML generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});