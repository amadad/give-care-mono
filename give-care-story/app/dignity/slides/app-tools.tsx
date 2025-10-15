"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide13() {
  const toolsDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
graph TD
    %% Tools & Knowledge
    Tools[Agent Tools] --> Extract[Profile Extractor]
    Tools --> Fields[Missing Fields]
    Tools --> Search[Facility Search]
    Tools --> SubCheck[Subscription]
    Tools --> KB[Knowledge Base]
    KB --> Local[Local KB]
    KB --> Programs[Eligibility]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    class Tools primary;
    class Extract,Fields,Search,SubCheck,KB,Local,Programs default;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Agent Tools</h2>
          <p className="font-body text-md text-amber-700">Core Capabilities</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={toolsDiagram} />
        </div>
      </div>
    </div>
  )
}
