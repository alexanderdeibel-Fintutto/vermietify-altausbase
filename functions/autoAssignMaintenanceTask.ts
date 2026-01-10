import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { issue_id, issue_type, location, building_id } = await req.json();

    // Get available vendors/technicians
    const allVendors = await base44.asServiceRole.entities.Vendor.list();
    
    // Filter vendors by specialty matching the issue type
    const specialtyMap = {
      heating: ['heating', 'general'],
      plumbing: ['plumbing', 'general'],
      electrical: ['electrical', 'general'],
      appliance: ['general'],
      temperature: ['heating', 'general'],
      humidity: ['plumbing', 'general'],
      noise: ['general'],
      other: ['general']
    };

    const requiredSpecialties = specialtyMap[issue_type] || ['general'];
    
    const suitableVendors = allVendors.filter(v => 
      v.is_active && 
      v.specialties?.some(s => requiredSpecialties.includes(s))
    );

    if (suitableVendors.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Keine passenden Techniker gefunden'
      });
    }

    // Score vendors based on multiple factors
    const scoredVendors = await Promise.all(suitableVendors.map(async (vendor) => {
      let score = 0;

      // Priority: Preferred vendors
      if (vendor.preferred) score += 50;

      // Rating
      if (vendor.rating) score += vendor.rating * 10;

      // Check recent tasks (workload)
      const recentTasks = await base44.asServiceRole.entities.VendorTask.filter({
        vendor_id: vendor.id,
        status: 'in_progress'
      });
      score -= recentTasks.length * 5; // Penalty for high workload

      // Emergency contact bonus
      if (vendor.emergency_contact) score += 20;

      return { vendor, score };
    }));

    // Sort by score (highest first)
    scoredVendors.sort((a, b) => b.score - a.score);
    const selectedVendor = scoredVendors[0].vendor;

    // Create maintenance task
    const task = await base44.asServiceRole.entities.MaintenanceTask.create({
      title: `Störung: ${issue_type}`,
      category: issue_type === 'electrical' ? 'electrical' : 
                issue_type === 'plumbing' ? 'plumbing' :
                issue_type === 'heating' || issue_type === 'temperature' ? 'heating' : 'general',
      building_id,
      assigned_to: selectedVendor.email,
      status: 'assigned',
      priority: 'medium',
      auto_task_created: true
    });

    return Response.json({
      success: true,
      assigned_to: selectedVendor.company_name,
      task_id: task.id,
      vendor
    });

  } catch (error) {
    console.error('Auto-assignment error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});