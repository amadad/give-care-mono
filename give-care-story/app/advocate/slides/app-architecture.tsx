"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function SlideArchitecture() {
  const architectureDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
graph TB
    %% External Services
    User[📱 Caregiver] --> Twilio[SMS Gateway]
    Twilio --> FastAPI[Backend App]
    
    %% Main Application Flow
    FastAPI --> Auth[Signature Validation]
    Auth --> Emergency[Emergency Detection]
    Emergency --> Verdict[Guardrails Framework]
    Verdict --> AzureGuard[LLM Guardrails]
    
    Emergency -->|Safe| UserMgmt[User Management]
    UserMgmt --> Supabase[(Data Backend)]
    Supabase --> Profile[Profile Extraction]
    
    Profile --> RateLimit[Rate Limiting]
    RateLimit --> Agent[Agent]
    
    %% Agent Processing
    Agent --> Memory[Agentic Memory]
    Agent --> Tools[Agent Tools]
    Agent --> Knowledge[Knowledge Bases]
    
    Memory --> PostgresDB[(Relational DB)]
    Tools --> Stripe[Payment API]
    Tools --> SerpAPI[Search API]
    Knowledge --> PgVector[(Vector Store)]
    
    %% AI Models
    Agent --> AzureMain[LLM Provider]
    Knowledge --> AzureEmbed[Embeddings Provider]
    
    %% Response Flow
    Agent --> Safety[Safety Check]
    Safety --> Response[SMS Response]
    Response --> Twilio
    
    %% Monitoring
    FastAPI --> Phoenix[Observability Dashboard]
    Phoenix --> Telemetry[Telemetry]

    %% Styling
    classDef user fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef api fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef agno fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef azure fill:#b8926a,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef database fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef verdict fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef monitoring fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class User user;
    class Twilio,FastAPI,Auth,UserMgmt,RateLimit,Safety,Response api;
    class Agent,Memory,Tools agno;
    class AzureMain,AzureGuard,AzureEmbed azure;
    class Supabase,PostgresDB,PgVector database;
    class Verdict verdict;
    class Phoenix,Telemetry monitoring;
    class Emergency,Profile,Knowledge,Stripe,SerpAPI primary;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">GiveCare System Architecture</h2>
          <p className="font-body text-md text-amber-700">Complete SMS caregiving assistant infrastructure</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={architectureDiagram} />
        </div>
      </div>
    </div>
  )
}