"use client"

import Image from "next/image"
import { SlideLayout, SlideTitle } from "../../components/slides"

export default function NewsHeadlines() {
  return (
    <SlideLayout variant="cream">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 md:px-8">
        <div className="w-full max-w-6xl space-y-8">
          {/* First Row - Two headlines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Image
                src="/gen02.webp"
                alt="Bloomberg headline: Why AI Is Better than Doctors at the Most Human Part of Medicine"
                width={600}
                height={200}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Image
                src="/gen03.webp"
                alt="New York Times headline: A.I. Chatbots Defeated Doctors at Diagnosing Illness"
                width={600}
                height={200}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
          
          {/* Second Row - Three headlines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <Image
                src="/gen04.webp"
                alt="BBC headline: Update that made ChatGPT 'dangerously' sycophantic pulled"
                width={400}
                height={150}
                className="w-full h-auto object-contain"
              />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <Image
                src="/gen05.webp"
                alt="Washington Post headline: Your chatbot friend might be messing with your mind"
                width={400}
                height={150}
                className="w-full h-auto object-contain"
              />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <Image
                src="/gen06.webp"
                alt="Wall Street Journal headline: Why AI May Be Listening In on Your Next Doctor's Appointment"
                width={400}
                height={150}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
        
      </div>
    </SlideLayout>
  )
}