import React from 'react';
import { 
  FaClock, 
  FaUserMd, 
  FaShieldAlt, 
  FaCogs, 
  FaMobileAlt, 
  FaHandsHelping 
} from 'react-icons/fa';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  color: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning';
}

const features: FeatureCard[] = [
  {
    icon: <FaClock className="h-6 w-6" />,
    title: "Stop After-Hours Staff Calls",
    description: "Families get instant answers 24/7—no one paged at midnight. 40% fewer after-hours calls.*",
    badge: "Always available",
    color: 'primary'
  },
  {
    icon: <FaUserMd className="h-6 w-6" />,
    title: "Support That Evolves With Residents",
    description: "Guidance adapts automatically as care needs change—your team doesn't have to update anything.",
    badge: "Adapts automatically",
    color: 'secondary'
  },
  {
    icon: <FaShieldAlt className="h-6 w-6" />,
    title: "Protected From Liability Risks",
    description: "Every response checked by clinical guardrails—bad advice gets flagged before it reaches families.",
    badge: "Clinically verified",
    color: 'accent'
  },
  {
    icon: <FaCogs className="h-6 w-6" />,
    title: "No IT Project Required",
    description: "Works with your existing systems—your team won't learn another platform.",
    badge: "No integration headaches",
    color: 'info'
  },
  {
    icon: <FaMobileAlt className="h-6 w-6" />,
    title: "Works on Any Family's Phone",
    description: "No apps to download or teach. Works via SMS on flip phones and smartphones alike.",
    badge: "Zero barriers",
    color: 'success'
  },
  {
    icon: <FaHandsHelping className="h-6 w-6" />,
    title: "Keep Families Informed Without Draining Staff",
    description: "Automated updates reduce repetitive questions—your team focuses on direct care.",
    badge: "Staff time saved",
    color: 'warning'
  }
];

export default function Features() {
  return (
    <div className="w-full py-16 md:py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 text-sm font-medium bg-amber-100 text-amber-800 rounded-full mb-4">
            What Your Team Gains
          </span>
          <h2 className="text-4xl font-serif font-bold text-amber-900 mb-4">
            Solve Your Biggest Challenges Without Adding to Your Workload
          </h2>
          <p className="text-lg text-amber-800/90">
            Your staff is stretched thin. Families need constant updates. Residents need consistent support. Here's how we help—without creating more work for your team.
          </p>
          <p className="text-sm text-amber-800/70 mt-2">*Based on pilot program data</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group relative overflow-hidden bg-base-100 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-base-200 hover:border-amber-200"
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-4 text-${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-amber-800/80 mb-4">
                  {feature.description}
                </p>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full bg-${feature.color}/10 text-${feature.color}`}>
                  {feature.badge}
                </span>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-${feature.color} transition-all duration-500`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
