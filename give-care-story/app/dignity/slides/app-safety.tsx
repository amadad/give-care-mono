"use client"

import dynamic from "next/dynamic"
import { useEffect } from "react"

const Mermaid = dynamic<{ chart: string }>(
  () => import("../../components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide12() {
  const safetyDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
graph TD
    %% Safety Flow
    U[User Message] --> Agent[Agno Agent]
    Agent --> Safety{Safety Check}
    Safety -->|Safe| Tools[Agent Tools]
    Safety -->|Unsafe| Block[Block & Redirect]
    Safety -->|Emergency| E911[Suggest 911]
    Safety --> Verdict[(Verdict AI)]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef secondary fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef emergency fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    class Agent,Safety,Tools primary;
    class Verdict,Block secondary;
    class U default;
    class E911 emergency;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Safety System</h2>
          <p className="font-body text-md text-amber-700">Message Protection</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={safetyDiagram} />
        </div>
      </div>
    </div>
  );
}
