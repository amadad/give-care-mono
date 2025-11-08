"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Slide8() {
  // Focus on the advocacy gap - those needing support vs. professional advocates available
  const totalNeedingSupport = 129_000_000 + 53_000_000 + 32_900_000; // Chronic disease + caregivers + inpatient discharges (removing overlaps conceptually)
  const professionalAdvocates = 1_040 + 2_000 + 11_600; // BCPA + Independent + Hospital reps
  
  const advocacyGapData = [
    { 
      name: "Population Needing Advocacy Support", 
      value: totalNeedingSupport, 
      color: "#DC2626",
      description: "Adults with chronic disease, family caregivers, and those requiring hospitalization"
    },
    { 
      name: "Professional Patient Advocates", 
      value: professionalAdvocates, 
      color: "#7F1D1D",
      description: "Board-certified advocates, independent advocates, and hospital patient representatives"
    }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: {cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number}) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {percent > 0.01 ? `${(percent * 100).toFixed(1)}%` : '<0.1%'}
      </text>
    );
  };

  const ratio = Math.round(totalNeedingSupport / professionalAdvocates);

  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-2xl">
          <h1 className="font-heading text-4xl leading-tight mb-lg text-amber-900">
            The Patient Advocacy Gap
          </h1>
          <p className="font-body text-lg text-amber-800">The scale of need vs. available professional support</p>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={advocacyGapData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={140}
                  fill="#8884d8"
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {advocacyGapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'People']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    border: '1px solid #D97706',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 space-y-6">
            {advocacyGapData.map((item, index) => (
              <div key={index} className="p-6 bg-white/60 rounded-xl">
                <div className="flex items-center gap-4 mb-3">
                  <div 
                    className="w-6 h-6 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <h3 className="font-heading text-xl text-amber-900">{item.name}</h3>
                </div>
                <div className="font-heading text-2xl font-bold text-amber-900 mb-md">
                  {item.value.toLocaleString()}
                </div>
                <p className="font-body text-md text-amber-800">{item.description}</p>
              </div>
            ))}
            
            <div className="p-6 bg-amber-900/10 rounded-xl border-2 border-amber-900/20">
              <div className="text-center">
                <div className="font-heading text-3xl font-bold text-amber-900 mb-md">
                  1 : {ratio.toLocaleString()}
                </div>
                <p className="font-body text-md text-amber-800">
                  Ratio of professional advocates to people needing support
                </p>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="font-body text-sm text-amber-700 opacity-80">
              Source: WIP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}