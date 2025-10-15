"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide19() {
  const escalationDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
  graph TD
      Start[Caregiver Message] --> Triage{Triage & Safety Check}
      Triage -->|Routine| AI[AI Response]
      AI --> Done[Provide Micro-Intervention]
      Triage -->|Concern| Human[Care Navigator]
      Human --> Follow[Follow-up & Document]
      Triage -->|Emergency| E911[Emergency Services]

      classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
      classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
      classDef secondary fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
      classDef emergency fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
      class Start,AI,Done,Triage primary;
      class Human,Follow secondary;
      class E911 emergency;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Escalation Pathway</h2>
          <p className="font-body text-md text-amber-700">How issues move from AI to humans</p>
        </div>

        <div className="w-full">
          <Mermaid chart={escalationDiagram} />
        </div>
      </div>
    </div>
  )
}
