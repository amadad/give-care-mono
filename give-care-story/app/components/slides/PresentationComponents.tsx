"use client";

import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface BigHeadlineProps {
  children: ReactNode;
  className?: string;
  size?: 'xl' | '2xl' | '3xl' | '4xl';
}

export function BigHeadline({ children, className = '', size = '3xl' }: BigHeadlineProps) {
  const sizeClasses = {
    xl: 'text-5xl md:text-6xl lg:text-7xl',
    '2xl': 'text-6xl md:text-7xl lg:text-8xl',
    '3xl': 'text-7xl md:text-8xl lg:text-9xl',
    '4xl': 'text-8xl md:text-9xl lg:text-[12rem]',
  };

  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`font-heading font-bold leading-tight ${sizeClasses[size]} ${className}`}
    >
      {children}
    </motion.h1>
  );
}

interface SupportingTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function SupportingText({ children, className = '', delay = 0.3 }: SupportingTextProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`font-body text-2xl md:text-3xl lg:text-4xl leading-relaxed ${className}`}
    >
      {children}
    </motion.p>
  );
}

interface AnimatedListProps {
  items: string[];
  className?: string;
  itemClassName?: string;
  startDelay?: number;
  staggerDelay?: number;
}

export function AnimatedList({
  items,
  className = '',
  itemClassName = '',
  startDelay = 0.5,
  staggerDelay = 0.2
}: AnimatedListProps) {
  return (
    <ul className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <motion.li
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.5,
            delay: startDelay + (index * staggerDelay),
            ease: "easeOut"
          }}
          className={`font-body text-xl md:text-2xl lg:text-3xl leading-relaxed flex items-start ${itemClassName}`}
        >
          <span className="mr-4 text-amber-500 flex-shrink-0">•</span>
          <span>{item}</span>
        </motion.li>
      ))}
    </ul>
  );
}

interface Stat {
  value: string;
  label: string;
  description?: string;
}

interface StatGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
  className?: string;
  startDelay?: number;
}

export function StatGrid({
  stats,
  columns = 3,
  className = '',
  startDelay = 0.4
}: StatGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6 lg:gap-8 ${className}`}>
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: startDelay + (index * 0.1),
            ease: "easeOut"
          }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg"
        >
          <div className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-amber-900">
            {stat.value}
          </div>
          <div className="font-heading text-xl md:text-2xl mb-2 text-amber-800">
            {stat.label}
          </div>
          {stat.description && (
            <div className="font-body text-lg text-amber-700 opacity-80">
              {stat.description}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

interface ProgressiveRevealProps {
  children: ReactNode[];
  className?: string;
  startDelay?: number;
  staggerDelay?: number;
}

export function ProgressiveReveal({
  children,
  className = '',
  startDelay = 0.3,
  staggerDelay = 0.3
}: ProgressiveRevealProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: startDelay + (index * staggerDelay),
            ease: "easeOut"
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

interface ComparisonProps {
  wrong: string;
  right: string;
  className?: string;
  startDelay?: number;
}

export function Comparison({ wrong, right, className = '', startDelay = 0.5 }: ComparisonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: startDelay, ease: "easeOut" }}
        className="flex items-start gap-4 p-4 rounded-lg bg-red-900/20 border-l-4 border-red-500"
      >
        <span className="text-2xl flex-shrink-0">❌</span>
        <p className="font-body text-xl md:text-2xl text-red-200">{wrong}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: startDelay + 0.3, ease: "easeOut" }}
        className="flex items-start gap-4 p-4 rounded-lg bg-green-900/20 border-l-4 border-green-500"
      >
        <span className="text-2xl flex-shrink-0">✅</span>
        <p className="font-body text-xl md:text-2xl text-green-200">{right}</p>
      </motion.div>
    </div>
  );
}

interface D3ProgressBarProps {
  percentage: number;
  label: string;
  className?: string;
  delay?: number;
}

export function D3ProgressBar({ percentage, label, className = '', delay = 0.5 }: D3ProgressBarProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = 60;

    svg.selectAll("*").remove();

    const scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width - 40]);

    const bar = svg.append("rect")
      .attr("x", 20)
      .attr("y", 20)
      .attr("height", 20)
      .attr("rx", 10)
      .attr("fill", "#f59e0b")
      .attr("width", 0);

    setTimeout(() => {
      bar.transition()
        .duration(1500)
        .ease(d3.easeCubicOut)
        .attr("width", scale(percentage));
    }, delay * 1000);

    svg.append("text")
      .attr("x", 20)
      .attr("y", 15)
      .attr("class", "font-heading text-sm fill-current")
      .text(label);

  }, [percentage, label, delay]);

  return (
    <div className={className}>
      <svg ref={svgRef} width="100%" height="60"></svg>
    </div>
  );
}

interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  leftDelay?: number;
  rightDelay?: number;
}

export function TwoColumnLayout({
  left,
  right,
  className = '',
  leftDelay = 0.3,
  rightDelay = 0.5
}: TwoColumnLayoutProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-8 lg:gap-12 ${className}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: leftDelay, ease: "easeOut" }}
      >
        {left}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: rightDelay, ease: "easeOut" }}
      >
        {right}
      </motion.div>
    </div>
  );
}
