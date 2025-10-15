"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function SlideKnowledge() {
  const knowledgeDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
graph TD
    %% Knowledge Base Sources
    LocalFiles[caregiver_kb/] --> TextKB[TextKnowledgeBase]
    EligibilityJSON[res/care.json] --> JsonKB[JSONKnowledgeBase]
    
    %% Combined Knowledge Base
    TextKB --> Combined[CombinedKnowledgeBase]
    JsonKB --> Combined
    
    %% Vector Database Integration
    TextKB --> PgVector1[(PgVector - caregiver_text_documents)]
    JsonKB --> PgVector2[(PgVector - eligibility_programs)]
    
    %% Embeddings
    PgVector1 --> Embedder[AzureOpenAIEmbedder]
    PgVector2 --> Embedder
    Embedder --> AzureEmbed[Azure OpenAI Embeddings API]
    
    %% Agent Integration
    Combined --> Agent[Agent]
    Agent --> Search[Knowledge Search]
    Search --> Context[Contextual Retrieval]
    
    %% Query Flow
    UserQuery[User SMS Query] --> Agent
    Context --> Relevant[Relevant Knowledge]
    Relevant --> Response[Enhanced Response]
    
    %% Knowledge Loading
    TextKB --> Load1[load recreate=False]
    JsonKB --> Load2[load recreate=False]
    Load1 --> Ready1[Text KB Ready]
    Load2 --> Ready2[JSON KB Ready]
    
    %% Content Types
    Ready1 --> Caregiving[Caregiving Guides]
    Ready1 --> Resources[Local Resources]
    Ready2 --> Programs[Eligibility Programs]
    Ready2 --> Benefits[Benefit Information]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef agno fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef azure fill:#b8926a,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef database fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef knowledge fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef content fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class LocalFiles,EligibilityJSON,UserQuery default;
    class Search,Context,Load1,Load2 primary;
    class Agent agno;
    class Embedder,AzureEmbed azure;
    class PgVector1,PgVector2 database;
    class TextKB,JsonKB,Combined,Relevant,Response knowledge;
    class Ready1,Ready2,Caregiving,Resources,Programs,Benefits content;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Knowledge Base Architecture</h2>
          <p className="font-body text-md text-amber-700">PgVector + Azure embeddings + combined knowledge sources</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={knowledgeDiagram} />
        </div>
      </div>
    </div>
  )
}