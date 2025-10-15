"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide13() {
  const toolsDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
graph TD
    %% Agent Tools & Knowledge
    Agent[Agent] --> Tools[Agent Tools]
    Agent --> Models[AI Models]
    Agent --> KB[Knowledge Bases]
    
    Tools --> ManageSub[manage_subscription]
    Tools --> FacilitySearch[facility_search]
    
    ManageSub --> Stripe[Stripe Checkout API]
    FacilitySearch --> SerpAPI[SerpApi Tools]
    FacilitySearch --> Premium{Premium Feature Check}
    
    Models --> Primary[PRIMARY_MODEL]
    Models --> Guardrails[GUARDRAIL_MODEL]
    
    KB --> TextKB[TextKnowledgeBase]
    KB --> JsonKB[JSONKnowledgeBase]
    KB --> Combined[CombinedKnowledgeBase]
    
    TextKB --> PgVector1[(PgVector - caregiver_kb)]
    JsonKB --> PgVector2[(PgVector - eligibility_programs)]
    Combined --> Embedder[TextEmbedder]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef agno fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef model fill:#b8926a,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef database fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef api fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class Agent agno;
    class Tools,Premium primary;
    class ManageSub,FacilitySearch default;
    class Models,Primary,Guardrails,Embedder model;
    class PgVector1,PgVector2 database;
    class Stripe,SerpAPI api;
    class KB,TextKB,JsonKB,Combined default;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Agent Tools & Knowledge</h2>
          <p className="font-body text-md text-amber-700">Azure OpenAI + PgVector + Stripe + SerpAPI integration</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={toolsDiagram} />
        </div>
      </div>
    </div>
  )
}
