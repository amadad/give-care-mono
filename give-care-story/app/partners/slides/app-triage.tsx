"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide19() {
  const escalationDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
  graph TD
      SMS[SMS via Twilio] --> FastAPI[FastAPI /sms Endpoint]
      FastAPI --> Validate[Twilio Signature Validation]
      Validate --> Emergency{Emergency Detection}
      Emergency -->|Critical| E911[Call 911 Response]
      Emergency -->|High| Urgent[Contact Provider Now]
      Emergency -->|None| Safety{Verdict Safety Check}
      
      Safety -->|Safe| Agent[Agent Processing]
      Safety -->|Unsafe| Block[Block & Safe Response]
      Safety -->|Caution| Disclaimer[Add Medical Disclaimer]
      
      Agent --> Tools[Agent Tools Execution]
      Tools --> Response[SMS Response via Twilio]
      Block --> Response
      Disclaimer --> Response

      classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
      classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
      classDef secondary fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
      classDef emergency fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
      classDef tech fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
      
      class SMS,FastAPI,Response tech;
      class Agent,Tools,Safety primary;
      class Validate,Block,Disclaimer secondary;
      class E911,Urgent emergency;
      class Emergency default;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">SMS Processing Pipeline</h2>
          <p className="font-body text-md text-amber-700">FastAPI + Twilio + Verdict integration</p>
        </div>

        <div className="w-full">
          <Mermaid chart={escalationDiagram} />
        </div>
      </div>
    </div>
  )
}
