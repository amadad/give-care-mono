"use client"

import { useState, useEffect } from "react"
import { Pie, PieChart, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
} from "@/app/components/ui/chart"
import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides"

const chartData = [
  { category: "Feelings of Guilt", value: 30, fill: "#8B4513" },  // Saddle Brown
  { category: "Conflict", value: 20, fill: "#A0522D" },         // Sienna
  { category: "Facility Decisions", value: 25, fill: "#D2691E" }, // Chocolate
  { category: "Medical", value: 15, fill: "#CD853F" },          // Peru
  { category: "Scheduling", value: 10, fill: "#DEB887" },        // Burlywood
]

const chartConfig = {
  value: {
    label: "Percentage",
  },
  "Feelings of Guilt": {
    label: "Feelings of Guilt",
    color: "#8B4513",
  },
  "Conflict": {
    label: "Conflict",
    color: "#A0522D",
  },
  "Facility Decisions": {
    label: "Facility Decisions",
    color: "#D2691E",
  },
  "Medical": {
    label: "Medical",
    color: "#CD853F",
  },
  "Scheduling": {
    label: "Scheduling",
    color: "#DEB887",
  },
} satisfies ChartConfig

export default function Slide11() {
  const [data, setData] = useState<typeof chartData>(chartData.map(item => ({ ...item, value: 0 })))

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(chartData)
    }, 100)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="4xl">
        <SlideTitle className="mb-lg">
          GiveCare Beta
        </SlideTitle>
        <SlideBody className="text-center mb-xl">
          Conversation Themes, n=10
        </SlideBody>
      
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="w-full max-w-[700px] mb-8">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square"
          >
            <PieChart>
              <Pie 
                data={data} 
                dataKey="value" 
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius="80%"
                startAngle={90}
                endAngle={-270}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                fontSize={18}
                labelLine={false}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={2000}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="font-body text-sm">
                {item.category} ({item.value}%)
              </span>
            </div>
          ))}
        </div>
      </div>
      </CenteredContent>
    </SlideLayout>
  )
}
