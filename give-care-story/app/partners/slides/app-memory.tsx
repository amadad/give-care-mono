"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide14() {
  const memoryDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
graph TD
    %% Agentic Memory System
    Agent[Agent] --> Memory[Agent Memory]
    Memory --> PostgresDB[(PostgresMemoryDb)]
    
    Memory --> Agentic[enable_agentic_memory: true]
    Memory --> UserMem[enable_user_memories: true]
    
    Agentic --> AutoExtract[Auto Memory Extraction]
    AutoExtract --> Contexts[Conversation Contexts]
    AutoExtract --> Patterns[Pattern Recognition]
    
    UserMem --> ProfileSync[Profile Sync to Supabase]
    ProfileSync --> UsersTable[(users table)]
    ProfileSync --> CareTable[(care_recipients table)]
    
    Memory --> SessionStorage[PostgresStorage]
    SessionStorage --> Sessions[(agent_sessions)]
    
    PostgresDB --> MemoryTable[(agent_memory)]
    MemoryTable --> Search[Memory Search & Retrieval]
    Search --> Context[Contextual Responses]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef database fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef agno fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef tech fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class Agent,Memory,Agentic,UserMem agno;
    class AutoExtract,ProfileSync,Search,Context primary;
    class PostgresDB,UsersTable,CareTable,Sessions,MemoryTable database;
    class Contexts,Patterns,SessionStorage tech;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-4xl mx-auto space-y-16 px-4 md:px-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Agentic Memory</h2>
          <p className="font-body text-md text-amber-700">PostgresMemoryDb + automatic conversation context</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={memoryDiagram} />
        </div>
      </div>
    </div>
  )
}
