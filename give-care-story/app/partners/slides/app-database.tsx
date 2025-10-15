"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function SlideDatabase() {
  const databaseDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
graph TD
    %% Core Tables
    Users[(users)]
    CareRecipients[(care_recipients)]
    OnboardingState[(onboarding_state)]
    
    %% Application Tables
    AgentMemory[(agent_memory)]
    AgentSessions[(agent_sessions)]
    KnowledgeText[(caregiver_text_documents)]
    KnowledgeEligibility[(eligibility_programs)]
    
    %% Payment Tables
    StripeCustomers[(payment_customers)]
    StripeSubscriptions[(payment_subscriptions)]
    StripeEvents[(payment_events)]
    
    %% Relationships
    Users -->|1:1| OnboardingState
    Users -->|1:N| CareRecipients
    Users -->|1:1| StripeCustomers
    Users -->|1:N| StripeSubscriptions
    Users -->|phone_number| AgentSessions
    Users -->|user_id| AgentMemory
    
    %% User Fields
    Users --> UserFields[id UUID PK<br/>phone_number unique<br/>name, email, location<br/>subscription_status<br/>message_count<br/>onboarding_completed]
    
    %% Care Recipient Fields
    CareRecipients --> CareFields[id UUID PK<br/>user_id UUID FK<br/>name, relationship<br/>age, medical_conditions<br/>location, notes]
    
    %% Memory Fields
    AgentMemory --> MemoryFields[Memory content<br/>Metadata JSONB<br/>Embeddings<br/>User context]
    
    %% Session Fields
    AgentSessions --> SessionFields[Session state<br/>Conversation history<br/>Agent configuration<br/>User preferences]
    
    %% Payment Fields
    StripeCustomers --> StripeCustomerFields[payment_customer_id<br/>user_id FK]
    StripeSubscriptions --> StripeSubFields[payment_subscription_id<br/>status, current_period_end<br/>user_id FK]

    %% Styling
    classDef table fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef agno fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef payment fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef fields fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef relationship fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class Users,CareRecipients,OnboardingState table;
    class AgentMemory,AgentSessions,KnowledgeText,KnowledgeEligibility agno;
    class StripeCustomers,StripeSubscriptions,StripeEvents payment;
    class UserFields,CareFields,MemoryFields,SessionFields,StripeCustomerFields,StripeSubFields fields;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Database Schema</h2>
          <p className="font-body text-md text-amber-700">Data backend tables + Memory tables + Payment integration</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={databaseDiagram} />
        </div>
      </div>
    </div>
  )
}