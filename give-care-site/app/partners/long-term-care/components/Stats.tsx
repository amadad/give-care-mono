import React from 'react';
import { FaClock, FaHeartbeat, FaUserMd } from 'react-icons/fa';

interface StatItem {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  color: 'primary' | 'secondary' | 'accent';
}

export default function Stats() {
  const stats: StatItem[] = [
    {
      icon: <FaClock className="text-3xl" />,
      title: 'Average Response Time',
      value: 'Under 1 min',
      description: '24/7 support',
      color: 'primary'
    },
    {
      icon: <FaHeartbeat className="text-3xl" />,
      title: 'Caregiver Satisfaction',
      value: '94%',
      description: 'Report reduced stress',
      color: 'secondary'
    },
    {
      icon: <FaUserMd className="text-3xl" />,
      title: 'Clinical Oversight',
      value: '100%',
      description: 'Medically reviewed',
      color: 'accent'
    }
  ];

  return (
    <div className="w-full py-12 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          {stats.map((stat, index) => (
            <div key={index} className="stat">
              <div className={`stat-figure text-${stat.color}`}>
                {stat.icon}
              </div>
              <div className="stat-title">{stat.title}</div>
              <div className={`stat-value text-${stat.color}`}>
                {stat.value}
              </div>
              <div className="stat-desc">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
