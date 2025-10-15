"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function SlideProfileExtraction() {
  const profileDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
graph TD
    %% SMS Input
    SMS[SMS Message] --> Keywords[Profile Keywords Detection]
    Keywords --> Dual{Dual Extraction System}
    
    %% Manual Structured Extraction
    Dual --> Manual[Manual Extraction]
    Manual --> Extract[Response Model]
    Extract --> UserModel[UserProfile Model]
    Extract --> CareModel[CareRecipientProfile Model]
    
    %% Agentic Memory Extraction  
    Dual --> Agentic[Agentic Memory]
    Agentic --> MemorySearch[Memory Search & Analysis]
    MemorySearch --> LLMExtract[LLM Profile Extraction]
    LLMExtract --> StructuredData[Structured Data Extraction]
    
    %% Database Storage
    UserModel --> UsersTable[(users table)]
    CareModel --> CareRecipientsTable[(care_recipients table)]
    StructuredData --> UsersTable
    StructuredData --> CareRecipientsTable
    
    %% Synchronization
    UsersTable --> Sync[Background Sync]
    CareRecipientsTable --> Sync
    Sync --> Consistency[Data Consistency Check]
    
    %% Onboarding Check
    Consistency --> Complete{Profile Complete?}
    Complete -->|Yes| MarkComplete[Mark Onboarding Complete]
    Complete -->|No| EncourageMore[Encourage More Sharing]
    
    %% Feedback Loop
    MarkComplete --> Feedback[Profile Feedback to User]
    EncourageMore --> Feedback

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef agno fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef database fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef azure fill:#b8926a,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef model fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class SMS,Keywords,Feedback default;
    class Dual,Complete,Sync,Consistency primary;
    class Agentic,MemorySearch agno;
    class UsersTable,CareRecipientsTable database;
    class Extract,LLMExtract azure;
    class UserModel,CareModel,StructuredData model;
    class Manual,EncourageMore,MarkComplete default;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Profile Extraction System</h2>
          <p className="font-body text-md text-amber-700">Dual approach: manual structured + agentic memory</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={profileDiagram} />
        </div>
      </div>
    </div>
  )
}