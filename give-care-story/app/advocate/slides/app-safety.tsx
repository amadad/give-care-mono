"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("../../components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide12() {
  const safetyDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
graph TD
    %% Multi-Layer Safety System
    SMS[SMS Message] --> Emergency{Emergency Detection Pipeline}
    Emergency --> Verdict1[Verdict Emergency Judge]
    Verdict1 --> Verify[Judge-then-Verify Pattern]
    
    Verify -->|Critical| E911[🚨 Call 911 Response]
    Verify -->|High| Urgent[⚠️ Contact Provider]
    Verify -->|None| ProcessMsg[Process Message]
    
    ProcessMsg --> Agent[Agent Response]
    Agent --> SafetyCheck{Safety Evaluation}
    SafetyCheck --> Verdict2[Verdict Medical Safety]
    
    Verdict2 -->|Safe| SendSMS[Send Response]
    Verdict2 -->|Caution| AddDisclaimer[Add Medical Disclaimer]
    Verdict2 -->|Unsafe| BlockMsg[Block & Safe Alternative]
    
    AddDisclaimer --> SendSMS
    BlockMsg --> SendSMS
    
    Verdict1 --> AzureModel[Azure OpenAI Guardrails Model]
    Verdict2 --> AzureModel

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef emergency fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef verdict fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef azure fill:#b8926a,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef agno fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class SMS,ProcessMsg,SendSMS default;
    class Emergency,SafetyCheck,AddDisclaimer,BlockMsg primary;
    class E911,Urgent emergency;
    class Verdict1,Verdict2,Verify verdict;
    class AzureModel azure;
    class Agent agno;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Multi-Layer Safety System</h2>
          <p className="font-body text-md text-amber-700">Verdict framework + Azure OpenAI guardrails</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={safetyDiagram} />
        </div>
      </div>
    </div>
  );
}
