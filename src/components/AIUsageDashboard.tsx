import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { useAIUsage } from "@/hooks/useAIUsage";
import { Cloud, Droplet, Lightbulb, Home, Shield, Leaf } from "lucide-react";

export const AIUsageDashboard = () => {
  const [activeTab, setActiveTab] = useState("Today");
  const location = useLocation();
  const { getFilteredData, getTotals } = useAIUsage();
  
  const tabs = ["Today", "Past Week", "Past Month"];
  
  // Get real data based on selected time period
  const getMetricsData = () => {
    const filteredData = getFilteredData(activeTab as 'Today' | 'Past Week' | 'Past Month');
    const totals = filteredData.reduce(
      (acc, usage) => ({
        co2_kg: acc.co2_kg + usage.co2_kg,
        water_l: acc.water_l + usage.water_l,
        energy_kwh: acc.energy_kwh + usage.energy_kwh,
        tokens: acc.tokens + usage.tokens,
      }),
      { co2_kg: 0, water_l: 0, energy_kwh: 0, tokens: 0 }
    );

    // Get latest usage for KPI
    const latestUsage = filteredData[0];

    return {
      co2: { 
        value: totals.co2_kg.toFixed(6), 
        unit: "KgCO₂", 
        label: "CO₂ Emissions" 
      },
      water: { 
        value: totals.water_l.toFixed(2), 
        unit: "Litres", 
        label: "Water Used", 
        description: `${Math.round(totals.water_l * 2)} water bottles used` 
      },
      energy: { 
        value: totals.energy_kwh.toFixed(3), 
        unit: "kWh", 
        label: "Energy Consumed", 
        description: `Can Power ${Math.round(totals.energy_kwh * 3.33)} Light Bulbs` 
      },
      kpi: latestUsage ? {
        tokensIn: `${latestUsage.co2_kg.toFixed(6)} KgCO₂`,
        tokensOut: `${latestUsage.water_l.toFixed(2)} L`,
        additional: `${latestUsage.energy_kwh.toFixed(6)} kWh`
      } : {
        tokensIn: "0.000000 KgCO₂",
        tokensOut: "0.00 L",
        additional: "0.000000 kWh"
      }
    };
  };

  const metrics = getMetricsData();

  const navItems = [
    { icon: Home, path: "/" },
    { icon: Shield, path: "/security" },
    { icon: Leaf, path: "/eco-garden" }
  ];

  return (
    <div className="chrome-extension-container">
      {/* Main Content */}
      <div className="chrome-extension-content">
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="extension-card">
            <div className="mb-3">
              <h1 className="text-lg font-medium text-gray-800">Welcome</h1>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Automatically tracking your Claude.ai environmental impact
            </p>
            
            {/* Time Period Tabs */}
            <div className="flex text-xs">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-1 mr-4 ${
                    activeTab === tab 
                      ? "text-gray-800 border-b border-gray-800" 
                      : "text-gray-500"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="space-y-3">
            <div className="extension-card flex items-center gap-4">
              <div className="metric-icon-large">
                <Cloud className="text-gray-600 w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-medium text-gray-800">
                  {metrics.co2.value} {metrics.co2.unit}
                </div>
                <div className="text-xs text-gray-500">{metrics.co2.label}</div>
              </div>
            </div>
            
            <div className="extension-card flex items-center gap-4">
              <div className="metric-icon-large flex items-center justify-center">
                <div className="flex space-x-0.5">
                  <div className="w-2 h-4 bg-blue-500 rounded-sm"></div>
                  <div className="w-2 h-4 bg-blue-500 rounded-sm"></div>
                  <div className="w-2 h-4 bg-blue-500 rounded-sm"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xl font-medium text-gray-800">
                  {metrics.water.value} {metrics.water.unit}
                </div>
                <div className="text-xs text-gray-500">{metrics.water.label}</div>
                <div className="text-xs text-gray-400">{metrics.water.description}</div>
              </div>
            </div>
            
            <div className="extension-card flex items-center gap-4">
              <div className="metric-icon-large flex items-center justify-center">
                <div className="flex space-x-0.5">
                  <div className="w-2 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-3 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xl font-medium text-gray-800">
                  {metrics.energy.value} {metrics.energy.unit}
                </div>
                <div className="text-xs text-gray-500">{metrics.energy.label}</div>
                <div className="text-xs text-gray-400">{metrics.energy.description}</div>
              </div>
            </div>
          </div>

          {/* KPIs Section */}
          <div className="extension-card">
            <h3 className="text-sm font-medium text-gray-800 mb-3">KPIs For Your Latest Prompt</h3>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">Tokens in</div>
                <div className="text-sm font-medium text-gray-800">{metrics.kpi.tokensIn}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Tokens out</div>
                <div className="text-sm font-medium text-gray-800">{metrics.kpi.tokensOut}</div>
              </div>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm font-medium text-gray-800">{metrics.kpi.additional}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <div className="chrome-extension-sidebar">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={index} to={item.path}>
              <div
                className={`chrome-nav-item ${
                  isActive ? "chrome-nav-active" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};