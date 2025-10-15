'use client';

import { useState } from 'react';
import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  quote: string;
  image: string;
  expertise: string[];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    name: 'Ali Madad',
    role: 'Founder & CEO',
    bio: 'Board-Certified Patient Advocate with 7 years of caregiving experience. Designer turned AI builder, passionate about transforming caregiver support.',
    quote: "Every caregiver deserves a companion who remembers, understands, and supports without judgment.",
    image: '/team/ali.jpg',
    expertise: ['Patient Advocacy', 'AI & Design', 'Caregiving Experience']
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'Head of AI',
    bio: 'Leading our AI development with expertise in natural language processing and empathetic AI systems. PhD in Computer Science from Stanford.',
    quote: "Technology should amplify human compassion, not replace it.",
    image: '/team/sarah.jpg',
    expertise: ['Machine Learning', 'NLP', 'Ethical AI']
  },
  {
    id: 3,
    name: 'Marcus Williams',
    role: 'Head of Care Experience',
    bio: 'Former hospice nurse with 15 years in palliative care. Ensures our platform meets real caregiver needs with clinical accuracy.',
    quote: "Behind every medical story is a human one that deserves to be heard.",
    image: '/team/marcus.jpg',
    expertise: ['Palliative Care', 'Clinical Experience', 'Care Navigation']
  }
];

export default function TeamGrid() {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);

  return (
    <section className="py-16 bg-gradient-to-b from-base-100 to-amber-50/30">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-amber-950 mb-4">Meet Our Team</h2>
            <p className="text-lg text-accessible-body max-w-2xl mx-auto">
              United by personal experience and professional expertise in caregiving, technology, and healthcare.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {TEAM_MEMBERS.map((member, index) => (
            <ScrollAnimationWrapper
              key={member.id}
              variant="fadeInUp"
              delay={index * 150}
            >
              <div
                className="group relative bg-base-100 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-amber-100"
                onMouseEnter={() => setHoveredMember(member.id)}
                onMouseLeave={() => setHoveredMember(null)}
              >
                {/* Image placeholder with gradient overlay */}
                <div className="relative h-64 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden">
                  <div className="absolute inset-0 bg-amber-900/10 group-hover:bg-amber-900/20 transition-colors duration-300" />
                  {/* Placeholder avatar */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-base-100/80 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Expertise badges */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                    {member.expertise.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white/90 text-amber-800 px-2 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-serif text-amber-950 mb-1">{member.name}</h3>
                  <p className="text-amber-700 font-medium mb-3">{member.role}</p>
                  
                  <div className={`transition-all duration-300 ${
                    hoveredMember === member.id ? 'opacity-0 max-h-0' : 'opacity-100 max-h-32'
                  }`}>
                    <p className="text-sm text-accessible-muted line-clamp-3">{member.bio}</p>
                  </div>

                  {/* Quote on hover */}
                  <div className={`transition-all duration-300 ${
                    hoveredMember === member.id ? 'opacity-100 max-h-32' : 'opacity-0 max-h-0'
                  } overflow-hidden`}>
                    <div className="border-l-4 border-amber-500 pl-4 py-2">
                      <p className="text-sm italic text-amber-800">"{member.quote}"</p>
                    </div>
                  </div>
                </div>

                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}