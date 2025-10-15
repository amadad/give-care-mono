import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "../../components/ui/chart";
import { SlideLayout, CenteredContent, SlideTitle } from "../../components/slides";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-amber-200 rounded-lg p-3 shadow-lg">
        <p className="font-heading text-sm text-amber-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-body text-sm text-amber-800">
              {entry.name}: {entry.value}M
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const caregiverConfig = {
  unpaidCaregivers: {
    label: "Unpaid Family Caregivers",
    color: "#92400e",
  },
  paidAides: {
    label: "Paid Home Care Aides", 
    color: "#f59e0b",
  },
  seniors65Plus: {
    label: "65+ Population",
    color: "#fbbf24",
  },
} satisfies ChartConfig;

const caregiverData = [
  {
    year: 2015,
    unpaidCaregivers: 43.5,
    paidAides: 2.13,
    seniors65Plus: 43.1,
  },
  {
    year: 2020,
    unpaidCaregivers: 53.0,
    paidAides: 3.47,
    seniors65Plus: 55.8,
  },
  {
    year: 2025,
    unpaidCaregivers: 62.5,
    paidAides: 4.0,
    seniors65Plus: 64.0,
  },
  {
    year: 2030,
    unpaidCaregivers: 72.0,
    paidAides: 4.60,
    seniors65Plus: 72.1,
  },
];

export default function CaregiverDataTable() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          Caregiving by the Numbers
        </SlideTitle>
        <div className="flex w-full items-center justify-center" style={{ height: "60vh" }}>
          <ChartContainer config={caregiverConfig} className="h-full w-4/5">
            <BarChart
              data={caregiverData}
              margin={{ top: 40, right: 30, left: 40, bottom: 40 }}
              accessibilityLayer
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                opacity={0.1}
              />
              <XAxis 
                dataKey="year" 
                stroke="currentColor"
                className="font-body text-amber-800"
              />
              <YAxis
                tickFormatter={(value) => `${value}M`}
                stroke="currentColor"
                className="font-body text-amber-800"
              />
              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                allowEscapeViewBox={{ x: false, y: false }}
                animationDuration={0}
              />
              <Bar
                dataKey="unpaidCaregivers"
                fill={caregiverConfig.unpaidCaregivers.color}
                name="Unpaid Family Caregivers"
                radius={4}
              />
              <Bar
                dataKey="paidAides"
                fill={caregiverConfig.paidAides.color}
                name="Paid Home Care Aides"
                radius={4}
              />
              <Bar
                dataKey="seniors65Plus"
                fill={caregiverConfig.seniors65Plus.color}
                name="65+ Population"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </div>
        
        <div className="mt-8 px-8 text-center">
          <p className="font-body text-sm text-amber-700 mb-2">
            <strong>Three curves in lock-step:</strong> From 2020 → 2025, older adults grow ~15%, 
            paid workforce needs ~16% growth, unpaid caregivers will cross 60M Americans
          </p>
          <p className="font-body text-xs text-amber-700">
            2015 & 2020 are observed counts. 2025 interpolated. 2030 aligns with official BLS/Census projections.
          </p>
        </div>
      </CenteredContent>
      
      {/* Source at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <span className="font-body text-sm text-amber-700">
          Sources: NAC/AARP, BLS OEWS & Employment Projections, U.S. Census, AoA/ACL
        </span>
      </div>
    </SlideLayout>
  );
}