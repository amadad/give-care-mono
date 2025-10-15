'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface BurnoutGaugeProps {
  currentScore: number; // 0-100
  targetScore?: number;
  trend?: 'improving' | 'declining' | 'stable';
  band?: string; // 'Crisis', 'High', 'Moderate', 'Low', 'Thriving'
  showSparkline?: boolean;
  sparklineData?: number[];
  className?: string;
}

export default function BurnoutGauge({
  currentScore,
  targetScore,
  trend,
  band,
  showSparkline = false,
  sparklineData = [],
  className = ''
}: BurnoutGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayScore(currentScore);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentScore]);

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-700', ring: 'ring-green-500' };
    if (score >= 60) return { bg: 'bg-green-400', text: 'text-green-600', ring: 'ring-green-400' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-700', ring: 'ring-yellow-500' };
    if (score >= 20) return { bg: 'bg-orange-500', text: 'text-orange-700', ring: 'ring-orange-500' };
    return { bg: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-500' };
  };

  const colors = getScoreColor(currentScore);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const progress = (displayScore / 100) * circumference;

  // Trend icon
  const getTrendIcon = () => {
    if (trend === 'improving') {
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    if (trend === 'declining') {
      return (
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Circular Gauge */}
      <div className="relative w-48 h-48">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="96"
            cy="96"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className={colors.bg}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <div className={`text-5xl font-bold ${colors.text}`}>
              {Math.round(displayScore)}
            </div>
            <div className="text-sm text-gray-600 font-medium">/ 100</div>
            {band && (
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                {band}
              </div>
            )}
          </motion.div>
        </div>

        {/* Target Score Marker (if provided) */}
        {targetScore && (
          <div
            className="absolute w-3 h-3 bg-amber-500 rounded-full border-2 border-white"
            style={{
              top: '50%',
              left: '50%',
              transform: `
                translate(-50%, -50%)
                rotate(${(targetScore / 100) * 360}deg)
                translateY(-50px)
              `,
            }}
          />
        )}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className="flex items-center gap-2 mt-4">
          {getTrendIcon()}
          <span className="text-sm font-medium text-gray-700 capitalize">
            {trend}
          </span>
        </div>
      )}

      {/* Sparkline (if provided) */}
      {showSparkline && sparklineData.length > 0 && (
        <div className="mt-4 w-full max-w-xs">
          <div className="flex items-end justify-between gap-1 h-12">
            {sparklineData.map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(value / 100) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className={`flex-1 ${colors.bg} rounded-t`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{sparklineData.length} days ago</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Target Info */}
      {targetScore && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          <span className="font-medium">Target:</span> {targetScore}/100
          {currentScore < targetScore && (
            <span className="text-amber-600 ml-2">
              ({targetScore - currentScore} points to go)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
