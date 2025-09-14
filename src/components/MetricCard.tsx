import { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  value: string;
  unit: string;
  label: string;
  description: string;
}

export const MetricCard = ({ icon, value, unit, label, description }: MetricCardProps) => {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="metric-icon">{icon}</div>
        <div>
          <div className="text-2xl font-bold">
            {value} {unit}
          </div>
          <div className="text-sm font-medium text-accent">{label}</div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
  );
};