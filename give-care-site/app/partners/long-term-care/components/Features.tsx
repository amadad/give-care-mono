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
    title: "24/7 SMS Line",
    description: "Always-On Help for Families",
    badge: "Always on",
    color: 'primary'
  },
  {
    icon: <FaUserMd className="h-6 w-6" />,
    title: "Adaptive Guidance",
    description: "Personalizes Tips as Needs Change",
    badge: "Smart",
    color: 'secondary'
  },
  {
    icon: <FaShieldAlt className="h-6 w-6" />,
    title: "Safety-First Design",
    description: "Three-Tier Medical Guardrails Screen Every Reply.",
    badge: "Protected",
    color: 'accent'
  },
  {
    icon: <FaCogs className="h-6 w-6" />,
    title: "Plug-and-Play Integration",
    description: "Works With Your Existing Care Software.",
    badge: "Seamless",
    color: 'info'
  },
  {
    icon: <FaMobileAlt className="h-6 w-6" />,
    title: "Zero Apps",
    description: "Any Phone, Any Caregiver.",
    badge: "Simple",
    color: 'success'
  },
  {
    icon: <FaHandsHelping className="h-6 w-6" />,
    title: "Family Updates",
    description: "Reduce After-Hours Calls by 40%*",
    badge: "Efficient",
    color: 'warning'
  }
];

export default function Features() {
  return (
    <div className="w-full py-16 md:py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 text-sm font-medium bg-amber-100 text-amber-800 rounded-full mb-4">
            Our Features
          </span>
          <h2 className="text-4xl font-serif font-bold text-amber-900 mb-4">
            Purpose-Built for Long-Term Care
          </h2>
          <p className="text-lg text-amber-800/90">
            Designed specifically for long-term care facilities to enhance resident care and staff efficiency.
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
