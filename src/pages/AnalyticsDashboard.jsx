import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/services/supabaseClient";
import VisualizationFilters from "@/components/analytics/VisualizationFilters";
import OccupancyChart from "@/components/analytics/OccupancyChart";
import OperatingCostsChart from "@/components/analytics/OperatingCostsChart";
import RentIncomeChart from "@/components/analytics/RentIncomeChart";
import BuildingComparisonChart from "@/components/analytics/BuildingComparisonChart";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";

export default function AnalyticsDashboard() {
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [timeRange, setTimeRange] = useState("month");
  const [occupancyChartType, setOccupancyChartType] = useState("bar");
  const [costChartType, setCostChartType] = useState("pie");
  const [incomeChartType, setIncomeChartType] = useState("area");

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_buildings_summary')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_units_with_lease')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_active_leases')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const filteredBuildings = useMemo(() => {
    let filtered = buildings;
    if (selectedBuilding !== "all") {
      filtered = filtered.filter(b => b.id === selectedBuilding);
    }

    if (sortBy === "name") {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "value") {
      return filtered.sort((a, b) => (b.total_units || 0) - (a.total_units || 0));
    }
    return filtered;
  }, [buildings, selectedBuilding, sortBy]);

  const occupancyData = useMemo(() => {
    return filteredBuildings.map(building => {
      const buildingUnits = units.filter(u => u.gebaeude_id === building.id);
      const occupiedUnits = buildingUnits.filter(u => u.vermietungsstatus === "Vermietet").length;
      const occupancy = buildingUnits.length > 0 
        ? Math.round((occupiedUnits / buildingUnits.length) * 100)
        : 0;
      
      return {
        id: building.id,
        name: building.name,
        occupancy: occupancy,
      };
    });
  }, [filteredBuildings, units]);

  const operatingCostsData = useMemo(() => {
    return [
      { name: "Hausverwaltung", value: 12500 },
      { name: "Reinigung", value: 8300 },
      { name: "Reparaturen", value: 15600 },
      { name: "Versicherung", value: 5200 },
      { name: "Nebenkosten", value: 22100 },
    ];
  }, []);

  const rentIncomeData = useMemo(() => {
    return [
      { month: "Jan", income: 45000, paid: 43500 },
      { month: "Feb", income: 45000, paid: 44800 },
      { month: "Mär", income: 45000, paid: 45000 },
      { month: "Apr", income: 47000, paid: 46200 },
      { month: "Mai", income: 47000, paid: 47000 },
      { month: "Jun", income: 47000, paid: 46800 },
    ];
  }, []);

  const buildingComparisonData = useMemo(() => {
    return filteredBuildings.map(building => {
      const buildingUnits = units.filter(u => u.gebaeude_id === building.id);
      const occupiedUnits = buildingUnits.filter(u => u.vermietungsstatus === "Vermietet").length;
      
      return {
        id: building.id,
        name: building.name,
        revenue: Math.round((occupiedUnits * 1500)),
        occupancy: buildingUnits.length > 0 
          ? Math.round((occupiedUnits / buildingUnits.length) * 100)
          : 0,
        units: buildingUnits.length,
      };
    });
  }, [filteredBuildings, units]);

  const handleReset = () => {
    setSelectedBuilding("all");
    setSortBy("name");
    setTimeRange("month");
  };

  const ChartTypeToggle = ({ currentType, onChange, options }) => (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {options.map(opt => (
        <Button
          key={opt.value}
          size="sm"
          variant={currentType === opt.value ? "default" : "ghost"}
          onClick={() => onChange(opt.value)}
          className="h-8 w-8 p-0"
          title={opt.label}
        >
          <opt.icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Visualisieren und analysieren Sie Ihre Gebäudedaten</p>
        </div>

        <VisualizationFilters
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          onBuildingChange={setSelectedBuilding}
          sortBy={sortBy}
          onSortChange={setSortBy}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onReset={handleReset}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Belegungsquote</h2>
              <ChartTypeToggle
                currentType={occupancyChartType}
                onChange={setOccupancyChartType}
                options={[
                  { value: "bar", icon: BarChart3, label: "Balkendiagramm" },
                  { value: "line", icon: LineChartIcon, label: "Liniendiagramm" },
                ]}
              />
            </div>
            <OccupancyChart data={occupancyData} chartType={occupancyChartType} />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Betriebskosten</h2>
              <ChartTypeToggle
                currentType={costChartType}
                onChange={setCostChartType}
                options={[
                  { value: "pie", icon: PieChartIcon, label: "Kreisdiagramm" },
                  { value: "bar", icon: BarChart3, label: "Balkendiagramm" },
                ]}
              />
            </div>
            <OperatingCostsChart data={operatingCostsData} chartType={costChartType} />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Mieteinnahmen</h2>
            <ChartTypeToggle
              currentType={incomeChartType}
              onChange={setIncomeChartType}
              options={[
                { value: "area", icon: BarChart3, label: "Flächendiagramm" },
                { value: "line", icon: LineChartIcon, label: "Liniendiagramm" },
              ]}
            />
          </div>
          <RentIncomeChart data={rentIncomeData} chartType={incomeChartType} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Gebäudevergleich</h2>
          <BuildingComparisonChart data={buildingComparisonData} />
        </div>
      </div>
    </div>
  );
}