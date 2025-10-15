'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface Milestone {
  day: number;
  status: 'completed' | 'in-progress' | 'upcoming';
  date?: string;
  daysRemaining?: number;
  title?: string;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  className?: string;
}

export default function MilestoneTimeline({
  milestones,
  className = ''
}: MilestoneTimelineProps) {
  const getStatusConfig = (status: Milestone['status']) => {
    const configs = {
      completed: {
        bg: 'bg-green-500',
        border: 'border-green-500',
        text: 'text-green-700',
        icon: '✓'
      },
      'in-progress': {
        bg: 'bg-amber-500',
        border: 'border-amber-500',
        text: 'text-amber-700',
        icon: '→'
      },
      upcoming: {
        bg: 'bg-gray-300',
        border: 'border-gray-300',
        text: 'text-gray-500',
        icon: ''
      }
    };
    return configs[status];
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between gap-4 relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        <motion.div
          className="absolute top-6 left-0 h-0.5 bg-green-500 -z-10"
          initial={{ width: '0%' }}
          animate={{
            width: `${(milestones.filter(m => m.status === 'completed').length / milestones.length) * 100}%`
          }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {milestones.map((milestone, index) => {
          const config = getStatusConfig(milestone.status);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center flex-1"
            >
              {/* Badge/Circle */}
              <div
                className={`
                  w-12 h-12 rounded-full border-4
                  ${config.bg} ${config.border}
                  flex items-center justify-center text-white font-bold
                  shadow-lg
                  ${milestone.status === 'in-progress' ? 'animate-pulse' : ''}
                `}
              >
                {config.icon || ''}
              </div>

              {/* Day Label */}
              <div className={`mt-2 text-sm font-semibold ${config.text}`}>
                Day {milestone.day}
              </div>

              {/* Title */}
              {milestone.title && (
                <div className="text-xs text-gray-600 text-center mt-1">
                  {milestone.title}
                </div>
              )}

              {/* Status Info */}
              {milestone.status === 'completed' && milestone.date && (
                <div className="text-xs text-gray-500 mt-1">
                  {milestone.date}
                </div>
              )}

              {milestone.status === 'in-progress' && milestone.daysRemaining !== undefined && (
                <div className="text-xs text-amber-600 mt-1 font-medium">
                  {milestone.daysRemaining} days left
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  );
}
