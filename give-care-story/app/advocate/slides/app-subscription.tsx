"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function SlideSubscription() {
  const subscriptionDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
graph TD
    %% User Request
    SMS[SMS Request] --> UserCheck[Get User Status]
    UserCheck --> SubStatus{Subscription Status}
    
    %% Subscription States
    SubStatus -->|active| FullAccess[Unlimited Access]
    SubStatus -->|inactive| FreeTier[Free Tier Check]
    SubStatus -->|trial| TrialCheck[Trial Limits Check]
    SubStatus -->|past_due| PaymentIssue[Payment Issue]
    
    %% Free Tier Logic
    FreeTier --> MessageCount{Message Count}
    MessageCount -->|< 10| BasicFeatures[Basic Features Only]
    MessageCount -->|>= 10| RateLimited[Rate Limited]
    
    %% Trial Logic
    TrialCheck --> TrialCount{Trial Messages}
    TrialCount -->|< 25| TrialActive[Trial Features]
    TrialCount -->|>= 25| TrialExpired[Trial Expired]
    
    %% Premium Features Gate
    BasicFeatures --> FeatureGate{Premium Feature?}
    FeatureGate -->|No| Process[Process Request]
    FeatureGate -->|Yes| UpgradePrompt[Upgrade Prompt]
    
    %% Subscription Flow
    RateLimited --> StripeCheckout[Stripe Checkout Session]
    TrialExpired --> StripeCheckout
    UpgradePrompt --> StripeCheckout
    PaymentIssue --> StripeCheckout
    
    StripeCheckout --> PaymentLink[Dynamic Payment Link]
    PaymentLink --> StripeWebhook[Stripe Webhook]
    StripeWebhook --> UpdateStatus[Update Subscription Status]
    
    %% Processing
    FullAccess --> Process
    TrialActive --> Process
    Process --> Response[SMS Response]
    
    %% Rate Limiter
    Response --> RateTracker[Update Message Count]
    RateTracker --> Supabase[(Supabase Users Table)]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef success fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef warning fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef error fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef stripe fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef database fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class SMS,UserCheck,Process,Response,RateTracker default;
    class SubStatus,MessageCount,TrialCount,FeatureGate primary;
    class FullAccess,TrialActive,BasicFeatures success;
    class FreeTier,UpgradePrompt warning;
    class RateLimited,TrialExpired,PaymentIssue error;
    class StripeCheckout,PaymentLink,StripeWebhook stripe;
    class UpdateStatus,Supabase database;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Subscription & Rate Limiting</h2>
          <p className="font-body text-md text-amber-700">Stripe integration + premium feature gating</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={subscriptionDiagram} />
        </div>
      </div>
    </div>
  )
}