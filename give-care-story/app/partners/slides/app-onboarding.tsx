"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function Slide15() {
  const onboardingDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px' }}}%%
graph TD
    %% SMS Onboarding Flow
    SMS[First SMS] --> GetUser[get_or_create_user]
    GetUser --> Check{onboarding_completed?}
    
    Check -->|false| Extract[Profile Extraction]
    Extract --> UsersTable[(users table)]
    Extract --> CareTable[(care_recipients table)]
    
    UsersTable --> UserFields[name, email, location<br/>phone_number, subscription_status<br/>message_count]
    CareTable --> CareFields[name, relationship, age<br/>medical_conditions, user_id]
    
    Check -->|true| RateLimit[Rate Limiting Check]
    Extract --> RateLimit
    
    RateLimit -->|Free: < 10 msgs| Agent[Agent Processing]
    RateLimit -->|Active Sub| Agent
    RateLimit -->|Over Limit| Subscribe[Subscription Prompt]
    
    Agent --> Response[SMS Response]
    Subscribe --> Response

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef database fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef warning fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef tech fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class SMS,GetUser,Extract,Agent,Response tech;
    class Check,RateLimit primary;
    class UsersTable,CareTable database;
    class UserFields,CareFields default;
    class Subscribe warning;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">User Onboarding & Data Flow</h2>
          <p className="font-body text-md text-amber-700">Supabase schema + conversational profile extraction</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={onboardingDiagram} />
        </div>
      </div>
    </div>
  )
}
