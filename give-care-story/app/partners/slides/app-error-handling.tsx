"use client"

import dynamic from "next/dynamic"

const Mermaid = dynamic<{ chart: string }>(
  () => import("@/app/components/ui/mermaid").then((mod) => mod.default),
  { ssr: false }
)

export default function SlideErrorHandling() {
  const errorDiagram = `%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
graph TD
    %% Main Processing Flow
    SMS[SMS Request] --> Try[Try Primary Processing]
    
    %% Primary Path
    Try --> Memory[Agentic Memory Processing]
    Memory --> Success{Success?}
    Success -->|Yes| Response[Success Response]
    
    %% Memory Failure Fallback
    Success -->|No| Fallback1[Manual Profile Extraction]
    Fallback1 --> Fallback1Success{Success?}
    Fallback1Success -->|Yes| LimitedResponse[Limited Response]
    Fallback1Success -->|No| BasicResponse[Basic Response]
    
    %% Agent Failure Fallback
    Try --> AgentFail[Agent Execution Error]
    AgentFail --> FallbackAgent[Fallback Response]
    FallbackAgent --> SafeResponse[Safe Fallback Message]
    
    %% Knowledge Base Failures
    Memory --> KBFail[Knowledge Base Unavailable]
    KBFail --> NoKB[Process Without KB]
    NoKB --> LimitedResponse
    
    %% Database Failures
    Try --> DBFail[Database Connection Error]
    DBFail --> Retry[Retry with Backoff]
    Retry --> RetrySuccess{Retry Success?}
    RetrySuccess -->|Yes| Memory
    RetrySuccess -->|No| GracefulDegradation[Graceful Degradation]
    
    %% Safety Failures
    Try --> SafetyFail[Safety Check Unavailable]
    SafetyFail --> DefaultSafe[Default to Safe Mode]
    DefaultSafe --> BasicSafety[Basic Safety Patterns]
    BasicSafety --> SafeResponse
    
    %% Timeout Handling
    Try --> Timeout[Processing Timeout]
    Timeout --> TimeoutResponse[Timeout Response]
    
    %% Final Error Handler
    GracefulDegradation --> ErrorLog[Log Error Details]
    BasicResponse --> ErrorLog
    SafeResponse --> ErrorLog
    TimeoutResponse --> ErrorLog
    
    ErrorLog --> FinalResponse[Final SMS Response]

    %% Styling
    classDef default fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#92400e;
    classDef primary fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef success fill:#d4a574,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef warning fill:#f59e0b,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef error fill:#c4956c,stroke:#92400e,stroke-width:2px,color:#451a03;
    classDef fallback fill:#e5b887,stroke:#92400e,stroke-width:2px,color:#451a03;
    
    class SMS,Try,Memory,ErrorLog,FinalResponse default;
    class Success,Fallback1Success,RetrySuccess primary;
    class Response,LimitedResponse success;
    class NoKB,Retry,DefaultSafe,BasicSafety warning;
    class AgentFail,DBFail,SafetyFail,KBFail,Timeout error;
    class Fallback1,FallbackAgent,GracefulDegradation,SafeResponse,BasicResponse,TimeoutResponse fallback;`

  return (
    <div className="min-h-screen w-full bg-[#FFE8D6] overflow-y-auto flex items-center">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-2xl">
          <h2 className="font-heading text-2xl mb-md">Error Handling & Fallbacks</h2>
          <p className="font-body text-md text-amber-700">Graceful degradation patterns + hybrid processing</p>
        </div>
        
        <div className="w-full">
          <Mermaid chart={errorDiagram} />
        </div>
      </div>
    </div>
  )
}