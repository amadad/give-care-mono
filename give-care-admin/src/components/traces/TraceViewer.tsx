import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Shield,
  Brain,
  Wrench,
  Database,
  Cloud,
  AlertTriangle
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// Type definitions matching Convex schema
type ExecutionTrace = {
  totalMs: number
  phases: {
    rateLimitMs?: number
    guardrailMs?: number
    contextBuildMs?: number
    agentMs?: number
    toolExecutionMs?: number
    persistenceMs?: number
  }
  spans: Array<{
    id: string
    name: string
    type: 'rate_limit' | 'guardrail' | 'agent' | 'tool' | 'database' | 'external_api'
    startMs: number
    durationMs: number
    status: 'success' | 'error' | 'skipped'
    metadata?: any
  }>
  model?: string
  cacheHit?: boolean
  rateLimitRemaining?: {
    smsUser: number
    smsGlobal: number
    openai: number
  }
  errors?: Array<{
    spanId: string
    message: string
    stack?: string
  }>
}

interface TraceViewerProps {
  trace: ExecutionTrace
  _conversationId: string
}

const getSpanIcon = (type: string) => {
  switch (type) {
    case 'rate_limit':
      return <Shield className="h-4 w-4" />
    case 'guardrail':
      return <Shield className="h-4 w-4" />
    case 'agent':
      return <Brain className="h-4 w-4" />
    case 'tool':
      return <Wrench className="h-4 w-4" />
    case 'database':
      return <Database className="h-4 w-4" />
    case 'external_api':
      return <Cloud className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getSpanColor = (type: string) => {
  switch (type) {
    case 'rate_limit':
      return 'border-l-orange-500'
    case 'guardrail':
      return 'border-l-blue-500'
    case 'agent':
      return 'border-l-purple-500'
    case 'tool':
      return 'border-l-green-500'
    case 'database':
      return 'border-l-amber-500'
    case 'external_api':
      return 'border-l-indigo-500'
    default:
      return 'border-l-muted-foreground'
  }
}

const getDurationBadge = (durationMs: number) => {
  if (durationMs < 100) {
    return <Badge variant="default" className="text-xs">⚡ {durationMs}ms</Badge>
  }
  if (durationMs < 500) {
    return <Badge variant="outline" className="text-xs">{durationMs}ms</Badge>
  }
  if (durationMs < 1000) {
    return <Badge variant="secondary" className="text-xs">{durationMs}ms</Badge>
  }
  return <Badge variant="destructive" className="text-xs">🐢 {durationMs}ms</Badge>
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'skipped':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    default:
      return null
  }
}

export function TraceViewer({ trace, _conversationId }: TraceViewerProps) {
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set())

  const toggleSpan = (spanId: string) => {
    setExpandedSpans(prev => {
      const next = new Set(prev)
      if (next.has(spanId)) {
        next.delete(spanId)
      } else {
        next.add(spanId)
      }
      return next
    })
  }

  // Calculate percentage of total time for visual bar
  const getTimePercentage = (durationMs: number) => {
    return Math.min(100, (durationMs / trace.totalMs) * 100)
  }

  // Get error for span if exists
  const getSpanError = (spanId: string) => {
    return trace.errors?.find(e => e.spanId === spanId)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Execution Trace
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total: <span className="font-mono font-semibold">{trace.totalMs}ms</span>
              {trace.model && <span className="ml-3">Model: <span className="font-mono">{trace.model}</span></span>}
              {trace.cacheHit !== undefined && (
                <Badge variant={trace.cacheHit ? "default" : "outline"} className="ml-2 text-xs">
                  {trace.cacheHit ? '✓ Cache Hit' : 'Cache Miss'}
                </Badge>
              )}
            </p>
          </div>

          {/* Rate Limit Status */}
          {trace.rateLimitRemaining && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>SMS User: {trace.rateLimitRemaining.smsUser} remaining</div>
              <div>SMS Global: {trace.rateLimitRemaining.smsGlobal} remaining</div>
              <div>OpenAI: {trace.rateLimitRemaining.openai} remaining</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Phase Summary */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {trace.phases.rateLimitMs !== undefined && (
            <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground">Rate Limit</div>
              <div className="font-mono font-semibold text-foreground">{trace.phases.rateLimitMs}ms</div>
            </div>
          )}
          {trace.phases.guardrailMs !== undefined && (
            <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground">Guardrails</div>
              <div className="font-mono font-semibold text-foreground">{trace.phases.guardrailMs}ms</div>
            </div>
          )}
          {trace.phases.contextBuildMs !== undefined && (
            <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground">Context</div>
              <div className="font-mono font-semibold text-foreground">{trace.phases.contextBuildMs}ms</div>
            </div>
          )}
          {trace.phases.agentMs !== undefined && (
            <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground">Agent</div>
              <div className="font-mono font-semibold text-foreground">{trace.phases.agentMs}ms</div>
            </div>
          )}
          {trace.phases.toolExecutionMs !== undefined && (
            <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground">Tools</div>
              <div className="font-mono font-semibold text-foreground">{trace.phases.toolExecutionMs}ms</div>
            </div>
          )}
          {trace.phases.persistenceMs !== undefined && (
            <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground">Database</div>
              <div className="font-mono font-semibold text-foreground">{trace.phases.persistenceMs}ms</div>
            </div>
          )}
        </div>

        {/* Linear Span Timeline */}
        <div className="space-y-2">
          {trace.spans.map((span, _index) => {
            const isExpanded = expandedSpans.has(span.id)
            const error = getSpanError(span.id)
            const timePercentage = getTimePercentage(span.durationMs)

            return (
              <Collapsible
                key={span.id}
                open={isExpanded}
                onOpenChange={() => toggleSpan(span.id)}
              >
                <Card className={cn('border-l-4 transition-all', getSpanColor(span.type))}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between w-full">
                        {/* Left side: Icon, Name, Status */}
                        <div className="flex items-center gap-3">
                          {getSpanIcon(span.type)}
                          <div className="text-left">
                            <div className="font-medium text-sm">{span.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Start: +{span.startMs}ms
                            </div>
                          </div>
                          {getStatusIcon(span.status)}
                          {error && <Badge variant="destructive" className="text-xs">Error</Badge>}
                        </div>

                        {/* Right side: Duration badge and expand icon */}
                        <div className="flex items-center gap-3">
                          {getDurationBadge(span.durationMs)}
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform',
                              isExpanded && 'transform rotate-180'
                            )}
                          />
                        </div>
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  {/* Duration Bar (visual representation) */}
                  <div className="px-4 pb-2">
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${timePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 space-y-3">
                      {/* Metadata */}
                      {span.metadata && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Metadata</p>
                          <pre className="text-xs bg-accent p-3 rounded-md overflow-x-auto">
                            {JSON.stringify(span.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Error Details */}
                      {error && (
                        <div>
                          <p className="text-xs font-semibold text-destructive mb-2">Error</p>
                          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                            <p className="text-sm font-mono">{error.message}</p>
                            {error.stack && (
                              <details className="mt-2">
                                <summary className="text-xs cursor-pointer text-muted-foreground">
                                  Stack trace
                                </summary>
                                <pre className="text-xs mt-2 overflow-x-auto">{error.stack}</pre>
                              </details>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}
        </div>

        {/* Empty State */}
        {trace.spans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No trace data available for this conversation</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
