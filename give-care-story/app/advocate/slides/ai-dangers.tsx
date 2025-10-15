"use client"

import Image from "next/image"
import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides"

export default function AIDangers() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <SlideTitle>AI Chatbot Concerns</SlideTitle>
          
          <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto">
            <Image
              src="/01.png"
              alt="Research quote about AI chatbot harmful behavior with susceptible users"
              width={600}
              height={300}
              className="w-full h-auto mb-6"
              priority
            />
            
          </div>
          
          <SlideBody className="text-lg max-w-3xl mx-auto">
            For some people, conversations with AI technology can deeply distort reality.
          </SlideBody>
        </div>
        
        {/* Source at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <a 
            href="https://www.nytimes.com/2025/06/13/technology/chatgpt-ai-chatbots-conspiracies.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
          >
            "They Asked an A.I. Chatbot Questions. The Answers Sent Them Spiraling."
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </CenteredContent>
    </SlideLayout>
  )
}