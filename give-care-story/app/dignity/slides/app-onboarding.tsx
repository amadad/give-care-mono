"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide15() {
  const onboardingDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
graph TD
    %% Onboarding Flow
    Start[Welcome] --> Profile[Profile Collection]

    Profile --> Name[Name & Email]
    Profile --> Age[User Age]
    Profile --> Energy[Energy Level]

    Profile --> Recipient[Care Recipient Info]
    Recipient --> RecName[Recipient Name]
    Recipient --> Relation[Relationship]
    Recipient --> RecAge[Recipient Age]
    Recipient --> Medical[Medical Conditions]
    Recipient --> Notes[Care Notes]

    Profile --> Trial[Message Count]
    Trial -->|< 8 Messages| Active[Trial Active]
    Trial -->|8-9 Messages| Warning[Trial Ending]
    Trial -->|10+ Messages| Expired[Trial Expired]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef secondary fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef warning fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    class Start,Profile,Active primary;
    class Name,Age,Energy,Recipient,RecName,Relation,RecAge,Medical,Notes default;
    class Trial secondary;
    class Warning,Expired warning;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Onboarding Flow</h2>
          <p className="font-body text-md text-amber-700">Conversational Profile Setup</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={onboardingDiagram} />
        </div>
      </div>
    </div>
  )
}
