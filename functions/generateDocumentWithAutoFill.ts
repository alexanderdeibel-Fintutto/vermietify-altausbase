import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import html2canvas from 'npm:html2canvas@1.4.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            document_type, 
            tenant_id, 
            contract_id, 
            unit_id, 
            building_id,
            document_data = {}
        } = await req.json();

        console.log(`Generating document with auto-fill: ${document_type}`);

        // Get template
        const templates = await base44.entities.DocumentTemplate.filter({
            document_type: document_type,
            is_active: true
        }, '-created_date', 1);

        if (!templates || templates.length === 0) {
            return Response.json({ error: 'No template found' }, { status: 404 });
        }

        const template = templates[0];
        let html = template.template_html;

        // Auto-fetch and merge data
        const autoData = { ...document_data };

        if (tenant_id) {
            try {
                const tenants = await base44.entities.Tenant.filter({ id: tenant_id });
                if (tenants.length > 0) {
                    const tenant = tenants[0];
                    Object.assign(autoData, {
                        tenant_first_name: tenant.first_name,
                        tenant_last_name: tenant.last_name,
                        tenant_email: tenant.email,
                        tenant_phone: tenant.phone,
                        tenant_address: `${tenant.address_history?.[0]?.street} ${tenant.address_history?.[0]?.house_number}, ${tenant.address_history?.[0]?.postal_code} ${tenant.address_history?.[0]?.city}`
                    });
                }
            } catch (e) {
                console.log('Failed to fetch tenant data:', e.message);
            }
        }

        if (unit_id) {
            try {
                const units = await base44.entities.Unit.filter({ id: unit_id });
                if (units.length > 0) {
                    const unit = units[0];
                    Object.assign(autoData, {
                        unit_number: unit.unit_number,
                        sqm: unit.sqm,
                        rooms: unit.rooms,
                        base_rent: unit.base_rent
                    });
                }
            } catch (e) {
                console.log('Failed to fetch unit data:', e.message);
            }
        }

        if (building_id) {
            try {
                const buildings = await base44.entities.Building.filter({ id: building_id });
                if (buildings.length > 0) {
                    const building = buildings[0];
                    Object.assign(autoData, {
                        building_name: building.name,
                        building_address: `${building.address} ${building.house_number}, ${building.postal_code} ${building.city}`,
                        landlord_name: building.contact_person || building.owner_name
                    });
                }
            } catch (e) {
                console.log('Failed to fetch building data:', e.message);
            }
        }

        if (contract_id) {
            try {
                const contracts = await base44.entities.LeaseContract.filter({ id: contract_id });
                if (contracts.length > 0) {
                    const contract = contracts[0];
                    Object.assign(autoData, {
                        start_date: contract.start_date,
                        end_date: contract.end_date,
                        base_rent: contract.base_rent,
                        total_rent: contract.total_rent,
                        deposit: contract.deposit
                    });
                }
            } catch (e) {
                console.log('Failed to fetch contract data:', e.message);
            }
        }

        // Replace placeholders
        Object.keys(autoData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            let value = autoData[key];
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            html = html.replace(regex, value || '');
        });

        // Generate PDF
        const canvas = await html2canvas(new DOMParser().parseFromString(html, 'text/html'), {
            scale: 2,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        const pdfBytes = pdf.output('arraybuffer');

        // Save PDF
        const filename = `${document_type}_${tenant_id}_${Date.now()}.pdf`;
        const uploadResult = await base44.integrations.Core.UploadPrivateFile({
            file: new Blob([pdfBytes])
        });

        // Create record
        const generatedDoc = await base44.entities.GeneratedDocument.create({
            document_type,
            tenant_id,
            contract_id,
            unit_id,
            building_id,
            pdf_file_uri: uploadResult.file_uri,
            document_data: autoData,
            distribution_status: 'generated'
        });

        return Response.json({
            success: true,
            document_id: generatedDoc.id,
            file_uri: uploadResult.file_uri
        });

    } catch (error) {
        console.error('Error generating document:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});