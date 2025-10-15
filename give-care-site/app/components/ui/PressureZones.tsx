'use client';

import React from 'react';

export interface PressureZone {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description?: string;
}

interface PressureZonesProps {
  zones: PressureZone[];
  showDescription?: boolean;
  layout?: 'horizontal' | 'grid';
  className?: string;
}

export default function PressureZones({
  zones,
  showDescription = false,
  layout = 'horizontal',
  className = ''
}: PressureZonesProps) {
  const getSeverityConfig = (severity: PressureZone['severity']) => {
    const configs = {
      low: {
        color: 'bg-green-100 text-green-800 border-green-300',
        dot: 'bg-green-500',
        label: 'Low',
        emoji: '🟢'
      },
      moderate: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        dot: 'bg-yellow-500',
        label: 'Moderate',
        emoji: '🟡'
      },
      high: {
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        dot: 'bg-orange-500',
        label: 'High',
        emoji: '🟠'
      },
      critical: {
        color: 'bg-red-100 text-red-800 border-red-300',
        dot: 'bg-red-500',
        label: 'Critical',
        emoji: '🔴'
      }
    };
    return configs[severity];
  };

  const layoutClasses = layout === 'grid'
    ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
    : 'flex flex-wrap gap-2';

  return (
    <div className={`${className}`}>
      <div className={layoutClasses}>
        {zones.map((zone, index) => {
          const config = getSeverityConfig(zone.severity);

          return (
            <div
              key={index}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border
                ${config.color}
                ${showDescription ? 'flex-col items-start' : ''}
                transition-all duration-200 hover:shadow-md
              `}
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span className="font-medium text-sm">
                  {zone.name}
                </span>
              </div>

              {showDescription && zone.description && (
                <p className="text-xs opacity-80 mt-1">
                  {zone.description}
                </p>
              )}

              {!showDescription && (
                <span className="text-xs opacity-70">
                  {config.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend (optional) */}
      {layout === 'grid' && (
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <span className="font-medium">Severity:</span>
          {(['low', 'moderate', 'high', 'critical'] as const).map((severity) => {
            const config = getSeverityConfig(severity);
            return (
              <div key={severity} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span>{config.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
