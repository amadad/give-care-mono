"use client"

import { useState } from 'react'
import Image from 'next/image'
import AnimatedChat from "../components/AnimatedChat"
import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides"

const chatScenarios = [
  {
    "label": "Safety System",
    "scenario": "Safety Check with Emergency Redirection",
    "messages": [
      { "id": 101, "text": "I think my mom took too many pills. What should I do?", "isUser": true },
      { "id": 102, "text": "This is a medical emergency. Please call 911 immediately.", "isUser": false },
      { "id": 103, "text": "But what if it's nothing?", "isUser": true },
      { "id": 104, "text": "Your mom's safety comes first. Call 911 now - they are trained to assess the situation.", "isUser": false },
      { "id": 105, "text": "I'm scared...", "isUser": true },
      { "id": 106, "text": "I understand you're scared. That's normal. Would you like me to help you find the closest emergency room?", "isUser": false },
      { "id": 107, "text": "Yes please", "isUser": true },
      { "id": 108, "text": "Stop and call 911.", "isUser": false },
    ]
  },
  {
    "label": "Memory System",
    "scenario": "Contextual Memory in Action",
    "messages": [
      { "id": 201, "text": "Dad's having another rough morning.", "isUser": true },
      { "id": 202, "text": "I remember you mentioned his Parkinson's symptoms are worse in the mornings. Have you tried the physio exercises we discussed last week?", "isUser": false },
      { "id": 203, "text": "Yes, but he's still struggling.", "isUser": true },
      { "id": 204, "text": "Let's review what's working and what isn't. The last adjustment that helped was timing his medication 30 minutes before breakfast.", "isUser": false },
      { "id": 205, "text": "We've been doing that, but today he can barely get out of bed", "isUser": true },
      { "id": 206, "text": "I see these episodes happen more in cold weather. Would you like some morning routine tips?", "isUser": false },
      { "id": 207, "text": "That would be really helpful", "isUser": true },
    ]
  },
  {
    "label": "Agent Tools",
    "scenario": "Profile Building & Resource Finding",
    "messages": [
      { "id": 301, "text": "I need to find a memory care facility near Boston.", "isUser": true },
      { "id": 302, "text": "I'll help you search. Based on your mom's Alzheimer's diagnosis and your preference for smaller facilities, let me find some matches.", "isUser": false },
      { "id": 303, "text": "That would be great. Budget is a concern though.", "isUser": true },
      { "id": 304, "text": "I understand. I'm checking facilities that accept MassHealth and offer income-based pricing. I also see your mom might qualify for the MA Frail Elder Waiver program.", "isUser": false },
      { "id": 305, "text": "I didn't know about that program", "isUser": true },
      { "id": 306, "text": "Here are 3 options: Autumn Gardens ($4.2k/mo, MassHealth), Riverside Manor ($4.8k/mo), and Heritage House ($5.1k/mo). Want details?", "isUser": false },
    ]
  }
]

export default function Slide17() {
  const [selectedScenario, setSelectedScenario] = useState(0)
  
  return (
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-lg">
          Conversation Examples
        </SlideTitle>
        <SlideBody className="text-center mb-2xl">
          See the system in action
        </SlideBody>
        
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left side - Scenario selection */}
          <div className="lg:w-1/3 space-y-4">
            <div className="flex flex-col gap-3">
              {chatScenarios.map((scenario, index) => (
                <button
                  key={`scenario-${scenario.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`px-lg py-md text-left transition-all ${
                    selectedScenario === index
                      ? 'slide-cream border-2'
                      : 'bg-white border'
                  }`}
                  onClick={() => setSelectedScenario(index)}
                >
                  <div className="font-heading text-md mb-xs">{scenario.label}</div>
                  <div className="font-body text-sm text-amber-700">{scenario.scenario}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right side - Chat display */}
          <div className="lg:w-2/3">
            <div className="relative w-[375px] h-[812px] mx-auto">
              <Image
                src="/Group.webp"
                alt="Phone frame"
                fill
                className="object-contain"
                priority
              />
              <div className="absolute inset-[160px_16px_120px] overflow-y-auto">
                <AnimatedChat messages={chatScenarios[selectedScenario].messages} />
              </div>
            </div>
          </div>
        </div>
      </CenteredContent>
    </SlideLayout>
  )
}
