"use client";

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

interface CirclePackingProps {
  value: number;
  total: number;
  label: string;
  sublabel?: string;
  className?: string;
}

export function CirclePacking({ value, total, label, sublabel, className = '' }: CirclePackingProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const data: any = { children: [{ value }, ...Array(total - value).fill({ value: 1 })] };

    const pack = d3.pack()
      .size([width - 100, height - 100])
      .padding(3);

    const root = d3.hierarchy(data)
      .sum((d: any) => d.value || 0);

    const nodes = pack(root).descendants().slice(1);

    g.selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("cx", d => d.x - width / 2)
      .attr("cy", d => d.y - height / 2)
      .attr("r", 0)
      .attr("fill", (d, i) => i < value ? "#f59e0b" : "#fef3c7")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .transition()
      .duration(1500)
      .delay((d, i) => i * 10)
      .attr("r", d => d.r);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 40)
      .attr("text-anchor", "middle")
      .attr("class", "font-heading text-3xl fill-current")
      .style("opacity", 0)
      .text(label)
      .transition()
      .duration(1000)
      .delay(1500)
      .style("opacity", 1);

    if (sublabel) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .attr("class", "font-body text-xl fill-current opacity-70")
        .style("opacity", 0)
        .text(sublabel)
        .transition()
        .duration(1000)
        .delay(1700)
        .style("opacity", 0.7);
    }

  }, [value, total, label, sublabel]);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg ref={svgRef} width="600" height="600"></svg>
    </div>
  );
}

interface SankeyNode {
  name: string;
  category?: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  className?: string;
}

export function SankeyDiagram({ nodes, links, className = '' }: SankeyDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 1000;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const sankeyLayout = sankey()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[50, 50], [width - 50, height - 50]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyLayout({
      nodes: nodes.map(d => ({ ...d })) as any,
      links: links.map(d => ({ ...d })) as any
    } as any);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    svg.append("g")
      .selectAll("rect")
      .data(sankeyNodes)
      .join("rect")
      .attr("x", (d: any) => d.x0 || 0)
      .attr("y", (d: any) => d.y0 || 0)
      .attr("height", 0)
      .attr("width", (d: any) => (d.x1 || 0) - (d.x0 || 0))
      .attr("fill", (d: any) => color(d.category || d.name))
      .transition()
      .duration(1000)
      .attr("y", (d: any) => d.y0 || 0)
      .attr("height", (d: any) => (d.y1 || 0) - (d.y0 || 0));

    const link = svg.append("g")
      .selectAll("path")
      .data(sankeyLinks)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke-width", (d: any) => Math.max(1, d.width || 1))
      .attr("stroke", "#999")
      .attr("fill", "none")
      .attr("opacity", 0)
      .transition()
      .duration(1500)
      .delay(1000)
      .attr("opacity", 0.3);

    svg.append("g")
      .selectAll("text")
      .data(sankeyNodes)
      .join("text")
      .attr("x", (d: any) => (d.x0 || 0) < width / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
      .attr("y", (d: any) => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => (d.x0 || 0) < width / 2 ? "start" : "end")
      .attr("class", "font-body text-lg fill-current")
      .style("opacity", 0)
      .text((d: any) => d.name)
      .transition()
      .duration(1000)
      .delay(2000)
      .style("opacity", 1);

  }, [nodes, links]);

  return (
    <div className={`flex justify-center ${className}`}>
      <svg ref={svgRef} width="1000" height="600"></svg>
    </div>
  );
}

interface RadialChartProps {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
  className?: string;
}

export function RadialChart({ data, maxValue = 100, className = '' }: RadialChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 700;
    const height = 700;
    const radius = Math.min(width, height) / 2 - 80;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const angleScale = d3.scaleLinear()
      .domain([0, data.length])
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, radius]);

    // Background circles
    [25, 50, 75, 100].forEach(val => {
      g.append("circle")
        .attr("r", radiusScale(val))
        .attr("fill", "none")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1)
        .attr("opacity", 0.5);

      g.append("text")
        .attr("y", -radiusScale(val))
        .attr("dy", "0.35em")
        .attr("class", "font-body text-sm fill-current opacity-50")
        .attr("text-anchor", "middle")
        .text(`${val}%`);
    });

    // Data areas
    const lineGenerator = d3.lineRadial()
      .angle((d, i) => angleScale(i))
      .radius((d: any) => radiusScale(d.value))
      .curve(d3.curveCardinalClosed);

    const path = g.append("path")
      .datum(data as any)
      .attr("d", lineGenerator as any)
      .attr("fill", "#f59e0b")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "#f59e0b")
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 0);

    path.transition()
      .duration(2000)
      .attr("stroke-opacity", 1);

    // Axes
    data.forEach((d, i) => {
      const angle = angleScale(i);
      const x = radius * Math.cos(angle - Math.PI / 2);
      const y = radius * Math.sin(angle - Math.PI / 2);

      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0)
        .attr("stroke", "#999")
        .attr("stroke-width", 1)
        .attr("opacity", 0.3)
        .transition()
        .duration(1000)
        .delay(i * 100)
        .attr("x2", x)
        .attr("y2", y);

      const labelRadius = radius + 40;
      const labelX = labelRadius * Math.cos(angle - Math.PI / 2);
      const labelY = labelRadius * Math.sin(angle - Math.PI / 2);

      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("dy", "0.35em")
        .attr("class", "font-body text-lg fill-current")
        .attr("text-anchor", labelX > 0 ? "start" : "end")
        .style("opacity", 0)
        .text(d.label)
        .transition()
        .duration(1000)
        .delay(1500 + i * 100)
        .style("opacity", 1);
    });

  }, [data, maxValue]);

  return (
    <div className={`flex justify-center ${className}`}>
      <svg ref={svgRef} width="700" height="700"></svg>
    </div>
  );
}

interface BarChartRaceProps {
  data: Array<{ label: string; value: number; color?: string }>;
  className?: string;
}

export function BarChartRace({ data, className = '' }: BarChartRaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = data.length * 80;
    const margin = { top: 20, right: 120, bottom: 20, left: 200 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 100])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    const bars = svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", margin.left)
      .attr("y", (d: any) => yScale(d.label) || 0)
      .attr("height", yScale.bandwidth())
      .attr("width", 0)
      .attr("fill", (d: any) => d.color || "#f59e0b")
      .attr("rx", 8);

    bars.transition()
      .duration(1500)
      .delay((d, i) => i * 200)
      .attr("width", (d: any) => xScale(d.value) - margin.left);

    svg.selectAll(".label")
      .data(data)
      .join("text")
      .attr("class", "label font-heading text-xl fill-current")
      .attr("x", margin.left - 10)
      .attr("y", (d: any) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .style("opacity", 0)
      .text((d: any) => d.label)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 200 + 500)
      .style("opacity", 1);

    svg.selectAll(".value")
      .data(data)
      .join("text")
      .attr("class", "value font-heading text-2xl fill-current")
      .attr("x", (d: any) => xScale(d.value) + 10)
      .attr("y", (d: any) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("opacity", 0)
      .text((d: any) => `${d.value}%`)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 200 + 1000)
      .style("opacity", 1);

  }, [data]);

  return (
    <div className={`flex justify-center ${className}`}>
      <svg ref={svgRef} width="800" height={data.length * 80}></svg>
    </div>
  );
}

interface InvisibleToVisibleProps {
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function InvisibleToVisible({
  beforeLabel = "Invisible Burnout",
  afterLabel = "Visible Support",
  className = ''
}: InvisibleToVisibleProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 1000;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Before state - scattered, faded points
    const beforePoints = Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      id: i
    }));

    // After state - organized, bright points
    const afterPoints = beforePoints.map((p, i) => ({
      x: 600 + (i % 10) * 35,
      y: 50 + Math.floor(i / 10) * 60,
      id: i
    }));

    const g = svg.append("g");

    const circles = g.selectAll("circle")
      .data(beforePoints)
      .join("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 0)
      .attr("fill", "#d1d5db")
      .attr("opacity", 0.3);

    // Animate in scattered state
    circles.transition()
      .duration(1000)
      .attr("r", 8);

    // Transform to organized state
    setTimeout(() => {
      circles.transition()
        .duration(2000)
        .attr("cx", (d, i) => afterPoints[i].x)
        .attr("cy", (d, i) => afterPoints[i].y)
        .attr("fill", "#f59e0b")
        .attr("opacity", 1);
    }, 2000);

    // Labels
    svg.append("text")
      .attr("x", 225)
      .attr("y", 380)
      .attr("text-anchor", "middle")
      .attr("class", "font-heading text-3xl fill-current opacity-50")
      .text(beforeLabel);

    svg.append("text")
      .attr("x", 775)
      .attr("y", 380)
      .attr("text-anchor", "middle")
      .attr("class", "font-heading text-3xl fill-amber-600")
      .style("opacity", 0)
      .text(afterLabel)
      .transition()
      .duration(1000)
      .delay(3000)
      .style("opacity", 1);

    // Arrow
    svg.append("path")
      .attr("d", "M 450 200 L 550 200")
      .attr("stroke", "#999")
      .attr("stroke-width", 3)
      .attr("marker-end", "url(#arrowhead)")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(2500)
      .attr("opacity", 1);

    svg.append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("refX", 9)
      .attr("refY", 3)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 10 3, 0 6")
      .attr("fill", "#999");

  }, [beforeLabel, afterLabel]);

  return (
    <div className={`flex justify-center ${className}`}>
      <svg ref={svgRef} width="1000" height="400"></svg>
    </div>
  );
}

interface LiveStatsProps {
  endpoint?: string;
  fallbackValue: string;
  label: string;
  className?: string;
}

export function LiveStats({ endpoint, fallbackValue, label, className = '' }: LiveStatsProps) {
  const [value, setValue] = useState(fallbackValue);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!endpoint) return;

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        setValue(data.value || fallbackValue);
        setIsLive(true);
      })
      .catch(() => {
        setValue(fallbackValue);
        setIsLive(false);
      });
  }, [endpoint, fallbackValue]);

  return (
    <div className={`text-center ${className}`}>
      <div className="font-heading text-7xl md:text-8xl font-bold mb-4 text-amber-600">
        {value}
      </div>
      <div className="font-body text-2xl md:text-3xl mb-2">
        {label}
      </div>
      {isLive && (
        <div className="flex items-center justify-center gap-2 text-green-500 text-sm">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="font-body">Live Data</span>
        </div>
      )}
    </div>
  );
}
