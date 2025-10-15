"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide14() {
  const memoryDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
graph TD
    %% Memory System
    Memory[Memory Manager] --> UserMem[User Memory]
    Memory --> AgentMem[Agent Memory]
    Memory --> Session[Session Memory]

    UserMem --> Profile[Caregiver Profile]
    UserMem --> CareRec[Care Recipient]
    UserMem --> History[Care History]

    AgentMem --> Context[Context]
    AgentMem --> Summaries[Summaries]
    AgentMem --> Insights[Insights]

    Session --> Turn[Turn]
    Session --> State[State]
    Session --> LastResp[Response]

    Memory --> DB[(Supabase)]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef database fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    class Memory primary;
    class DB database;
    class UserMem,AgentMem,Session,Profile,CareRec,History,Context,Summaries,Insights,Turn,State,LastResp default;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-4xl mx-auto space-y-16 px-4 md:px-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Memory System</h2>
          <p className="font-body text-md text-amber-700">Context Management</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={memoryDiagram} />
        </div>
      </div>
    </div>
  )
}
