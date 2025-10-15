"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function SlideMonitoring() {
  const monitoringDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
graph TD
    %% Application Instrumentation
    FastAPI[FastAPI Application] --> Phoenix[Phoenix Register]
    Phoenix --> Tracer[TracerProvider]
    
    %% OpenTelemetry Setup
    Tracer --> OTel[OpenTelemetry]
    OTel --> Collector[Phoenix Collector Endpoint]
    Collector --> Endpoint[admin.givecareapp.com/v1/traces]
    
    %% Instrumentation
    FastAPI --> Instrument[Instrumentor]
    Instrument --> AgentTraces[Agent Execution Traces]
    AgentTraces --> OTel
    
    %% Trace Collection
    OTel --> Batch[Batch Processing]
    Batch --> SelfHosted[Self-Hosted Phoenix]
    SelfHosted --> Dashboard[Phoenix Dashboard]
    
    %% What Gets Traced
    AgentTraces --> Memory[Memory Operations]
    AgentTraces --> Tools[Tool Executions]
    AgentTraces --> Models[Azure OpenAI Calls]
    AgentTraces --> Safety[Safety Checks]
    
    %% Performance Monitoring
    Dashboard --> ResponseTimes[Response Times]
    Dashboard --> ErrorRates[Error Rates]
    Dashboard --> TokenUsage[Token Usage]
    Dashboard --> UserPatterns[User Patterns]
    
    %% Configuration
    Phoenix --> Config[Phoenix Configuration]
    Config --> Project[givecare-prod]
    Config --> Auth[Phoenix API Key]
    Config --> AutoInstrument[auto_instrument: true]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef phoenix fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef otel fill:#b8926a,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef agno fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef metrics fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef config fill:#d97706,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class FastAPI,Batch default;
    class Collector,Endpoint,Dashboard primary;
    class Phoenix,SelfHosted phoenix;
    class OTel,Tracer otel;
    class Instrument,AgentTraces,Memory,Tools,Models,Safety default;
    class ResponseTimes,ErrorRates,TokenUsage,UserPatterns metrics;
    class Config,Project,Auth,AutoInstrument config;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Phoenix Observability Stack</h2>
          <p className="font-body text-md text-amber-700">OpenTelemetry + self-hosted Phoenix monitoring</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={monitoringDiagram} />
        </div>
      </div>
    </div>
  )
}