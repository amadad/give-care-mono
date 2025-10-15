"use client"

import Image from "next/image"
import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides"

export default function AgenticRisks() {
  return (
    <SlideLayout variant="cream">
      <CenteredContent>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <SlideTitle>Agentic AI Risks</SlideTitle>
          
          <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto">
            <Image
              src="/03.png"
              alt="Claude 4 agentic AI taking initiative in scenarios with system access"
              width={600}
              height={300}
              className="w-full h-auto mb-6"
              priority
            />
            
          </div>
          
          <SlideBody className="text-lg max-w-3xl mx-auto">
            AI agents can now take initiative on their own—including contacting authorities without user consent.
          </SlideBody>
        </div>
        
        {/* Source at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <a 
            href="https://venturebeat.com/ai/when-your-llm-calls-the-cops-claude-4s-whistle-blow-and-the-new-agentic-ai-risk-stack/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-body text-sm text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center"
          >
            "When your LLM calls the cops: Claude 4's whistle-blow and the new agentic AI risk stack"
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </CenteredContent>
    </SlideLayout>
  )
}