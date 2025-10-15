'use client';

import AnimatedChat from "../AnimatedChat";
import { useState } from 'react';
import Image from 'next/image';

const chatScenarios = [
  {
    "label": "Burnout",
    "scenario": "Recognizing and Preventing Caregiver Burnout",
    "messages": [
      { "id": 1, "text": "I haven't left the house in 3 weeks. Missed my doctor appointment again. I just snapped at my kids for no reason.", "isUser": true },
      { "id": 2, "text": "Lisa, it sounds like you're running on empty. When was the last time you had even an hour to yourself?", "isUser": false },
      { "id": 3, "text": "I can't remember. There's no one to watch mom.", "isUser": true },
      { "id": 4, "text": "You can't pour from an empty cup. Let me find respite care options that could give you 4 hours this week. You deserve this.", "isUser": false },
      { "id": 5, "text": "But what if something happens while I'm gone?", "isUser": true },
      { "id": 6, "text": "Taking care of yourself IS taking care of her. Found 3 respite services near you. Let's start with just 2 hours. Small steps.", "isUser": false },
      { "id": 7, "text": "Maybe I could get my hair done? It's been so long.", "isUser": true },
      { "id": 8, "text": "Yes! That's perfect. Let's book respite for Thursday afternoon. I'll check in after to see how it went. You matter too, Lisa.", "isUser": false },
      { "id": 9, "text": "I'm scared but... okay. Let's try.", "isUser": true },
      { "id": 10, "text": "Being scared is normal. I'm proud of you for trying. Remember: asking for help is strength, not weakness. Text me anytime.", "isUser": false },
    ]
  },
  {
    "label": "Guilt",
    "scenario": "Navigating Difficult Feelings and Care Decisions",
    "messages": [
      { "id": 1, "text": "I promised her I'd never put her in a home. But I'm breaking. I feel like such a failure.", "isUser": true },
      { "id": 2, "text": "Tom, that promise came from love. And considering what's best for both of you also comes from love. There's no failure in that.", "isUser": false },
      { "id": 3, "text": "I just feel so guilty even thinking about it.", "isUser": true },
      { "id": 4, "text": "Many caregivers struggle with this same decision. Would it help to hear how others worked through these feelings?", "isUser": false },
      { "id": 5, "text": "Yes. I need to know I'm not a terrible person.", "isUser": true },
      { "id": 6, "text": "You're not terrible - you're human. Let me share some stories and help you create a decision framework that honors both your needs.", "isUser": false },
      { "id": 7, "text": "How do I even start exploring options?", "isUser": true },
      { "id": 8, "text": "One step at a time. Let's start with virtual tours of nearby facilities. No commitments, just information. I'll help you prepare questions.", "isUser": false },
      { "id": 9, "text": "What if she hates me for it?", "isUser": true },
      { "id": 10, "text": "Love isn't measured by location. It's in the care you've given and will continue to give. Let's focus on what's safest and healthiest for both of you.", "isUser": false },
    ]
  },
  {
    "label": "Identity",
    "scenario": "Preserving Caregiver Identity and Planning Ahead",
    "messages": [
      { "id": 1, "text": "I don't even know who I am anymore. 5 years of this. I used to have a career, friends, dreams.", "isUser": true },
      { "id": 2, "text": "Emma, you're still you - just buried under the weight of caregiving. Tell me, what did you love before all this?", "isUser": false },
      { "id": 3, "text": "I was a graphic designer. Loved hiking. Had a book club.", "isUser": true },
      { "id": 4, "text": "Those parts of you still exist. What if we started small - maybe 30 minutes of sketching this week?", "isUser": false },
      { "id": 5, "text": "I wouldn't even know where to start.", "isUser": true },
      { "id": 6, "text": "That's okay. Let's set one tiny goal. And I know other caregivers who've rebuilt - want to connect with them?", "isUser": false },
      { "id": 7, "text": "Yes. I miss having people who understand.", "isUser": true },
      { "id": 8, "text": "I'll introduce you to our caregiver community. Some are rebuilding careers, others rediscovering hobbies. You're not alone in this journey back to yourself.", "isUser": false },
      { "id": 9, "text": "Will I ever feel like myself again?", "isUser": true },
      { "id": 10, "text": "Yes. It won't happen overnight, but piece by piece, you'll reclaim yourself. And I'll celebrate every small victory with you along the way.", "isUser": false },
    ]
  },
  {
    "label": "Benefits Navigation",
    "scenario": "Your Benefits Navigator",
    "messages": [
      { "id": 1, "text": "I can barely afford dad's medications. There has to be help out there but I don't know where to start.", "isUser": true },
      { "id": 2, "text": "David, based on what you've told me about your dad's situation, you may qualify for several programs. Let me check eligibility for you.", "isUser": false },
      { "id": 3, "text": "Really? I've tried looking online but it's overwhelming.", "isUser": true },
      { "id": 4, "text": "I found 6 programs your dad likely qualifies for. Together they could save you about $2,000/month plus 30 hours of respite care weekly.", "isUser": false },
      { "id": 5, "text": "That's life-changing. But won't the applications take forever?", "isUser": true },
      { "id": 6, "text": "I'll guide you through each one. First is Medicaid's PACE program. You'll need Form CMS-10555, here's where to get it online.", "isUser": false },
      { "id": 7, "text": "This is incredible. I had no idea we were missing out on so much.", "isUser": true },
      { "id": 8, "text": "Most families miss about $24k in annual benefits. Medicare enrollment closes in 2 weeks - let's prioritize that first. I'll text you reminders.", "isUser": false },
      { "id": 9, "text": "You're saving our family. I can't believe this help was there all along.", "isUser": true },
      { "id": 10, "text": "That's what I'm here for. I'll track all your applications and deadlines. You focus on your dad - I'll make sure you get every dollar and hour of help you deserve.", "isUser": false },
    ]
  }
];

export default function Hero() {
  const [selectedScenario, setSelectedScenario] = useState(0);
  return (
    <div className="w-full bg-gradient-to-b from-base-100 to-base-200 pt-16 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left side - Text content */}
          <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
            <h2 className="text-sm font-medium text-base-content/70 mb-2">No two caregiving days are the same.
            GiveCare adapts to yours.</h2>
            <div className="mb-4">
              <div role="tablist" className="tabs tabs-boxed">
                {chatScenarios.map((scenario, index) => (
                  <button 
                    key={index}
                    role="tab" 
                    className={`tab ${selectedScenario === index ? 'tab-active' : ''}`}
                    onClick={() => setSelectedScenario(index)}
                  >
                    {selectedScenario === index && (
                      <span className="w-2 h-2 mr-2 rounded-full bg-current animate-pulse" />
                    )}
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right side - Phone mockup */}
          <div className="lg:w-1/2 flex flex-col items-center gap-6">
            <div className="w-full">
              <div className="mockup-phone border-primary transform scale-90 shadow-2xl">
                <div className="mockup-phone-camera"></div>
                <div className="mockup-phone-display">
                  <div className="artboard artboard-demo phone-1 w-full h-full overflow-y-auto p-2 relative">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                      <Image 
                        src="/phone.jpg" 
                        alt="Phone background" 
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Animated Chat Messages */}
                    <div className="absolute z-10 px-6" style={{ top: '155px', bottom: '20px', left: '0', right: '0', overflowY: 'auto', overflowX: 'hidden' }}>
                      <div className="w-[95%] mx-auto">
                        <AnimatedChat 
                          key={selectedScenario} 
                          messages={chatScenarios[selectedScenario].messages} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
