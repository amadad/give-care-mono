"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function SlideRCS() {
  const rcsDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
graph TD
    %% Message Analysis
    SMS[Incoming SMS] --> Analyze[Message Analysis]
    Analyze --> TemplateBuilder[RCS Template Builder]
    
    %% Template Type Detection
    TemplateBuilder --> TypeDetect{determine_template_type}
    TypeDetect -->|emergency| Emergency[Emergency Template]
    TypeDetect -->|stress| Stress[Stress Assessment]
    TypeDetect -->|resource| Resource[Resource Finder]
    TypeDetect -->|subscription| Subscription[Subscription Signup]
    TypeDetect -->|daily| DailyCheckin[Daily Check-in]
    
    %% Template Components
    Emergency --> E911[🚨 Call 911 Button]
    Emergency --> FindER[🏥 Find ER Button]
    Emergency --> Crisis[☎️ Crisis Hotline]
    
    Stress --> StressLevels[😊 😐 😰 🆘 Options]
    
    Resource --> Medical[🏥 Medical Services]
    Resource --> HomeCare[🏠 Home Care]
    Resource --> Support[👥 Support Groups]
    Resource --> Financial[💰 Financial Aid]
    
    Subscription --> SignupCard[💙 Unlock Full Support Card]
    Subscription --> PaymentLink[💳 Subscribe Button]
    
    %% Rich Features
    Emergency --> QuickReply[Twilio Quick Reply]
    Resource --> ListPicker[Twilio List Picker]
    Subscription --> Card[Twilio Card]
    
    %% Facility Features
    Resource --> FacilityCarousel[Facility Carousel]
    FacilityCarousel --> CallButton[📞 Call Facility]
    FacilityCarousel --> Directions[🗺️ Get Directions]
    FacilityCarousel --> Info[ℹ️ More Info]
    
    %% Decision Logic
    TemplateBuilder --> ShouldUse{should_use_rcs}
    ShouldUse -->|Yes| RichMsg[Send RCS Template]
    ShouldUse -->|No| PlainSMS[Send Plain SMS]
    
    RichMsg --> TwilioRCS[Twilio RCS Response]
    PlainSMS --> TwilioSMS[Standard SMS Response]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef template fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef emergency fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef success fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef twilio fill:#b8926a,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef rich fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class SMS,Analyze,TemplateBuilder default;
    class TypeDetect,ShouldUse primary;
    class Emergency,Stress,Resource,Subscription,DailyCheckin template;
    class E911,FindER,Crisis emergency;
    class StressLevels,Medical,HomeCare,Support,Financial,SignupCard,PaymentLink success;
    class TwilioRCS,TwilioSMS twilio;
    class QuickReply,ListPicker,Card,FacilityCarousel,CallButton,Directions,Info rich;
    class RichMsg,PlainSMS default;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">RCS Rich Messaging System</h2>
          <p className="font-body text-md text-amber-700">Dynamic templates + interactive buttons + carousel responses</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={rcsDiagram} />
        </div>
      </div>
    </div>
  )
}