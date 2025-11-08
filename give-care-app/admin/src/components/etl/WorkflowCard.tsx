import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { getWorkflowStatusVariant } from '@/lib/constants'

interface WorkflowCardProps {
  workflow: any
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  // TODO: Implement api.etl.getWorkflow in Convex backend
  // const workflowDetails = useQuery(
  //   api.etl.getWorkflow,
  //   isExpanded ? { sessionId: workflow.sessionId } : 'skip'
  // )
  const workflowDetails: any = null

  const startedAt = new Date(workflow.startedAt)
  const duration = workflow.durationMs
    ? `${(workflow.durationMs / 1000).toFixed(1)}s`
    : 'Running...'

  const statusVariant = getWorkflowStatusVariant(workflow.status)
  const StatusIcon = statusVariant.icon

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Summary Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{workflow.task}</h4>
            <Badge variant="secondary" className={statusVariant.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusVariant.label}
            </Badge>
            {workflow.state && (
              <Badge variant="outline" className="text-xs">
                {workflow.state}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{startedAt.toLocaleString()}</span>
            <span>•</span>
            <span>{workflow.currentStep}</span>
            <span>•</span>
            <span>{duration}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">{workflow.sourcesCount}</div>
            <div className="text-muted-foreground text-xs">sources</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{workflow.extractedCount}</div>
            <div className="text-muted-foreground text-xs">extracted</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{workflow.validatedCount}</div>
            <div className="text-muted-foreground text-xs">validated</div>
          </div>
          {workflow.errorCount > 0 && (
            <div className="text-center">
              <div className="font-semibold text-destructive">{workflow.errorCount}</div>
              <div className="text-muted-foreground text-xs">errors</div>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 ml-2" data-testid="chevron-up" />
          ) : (
            <ChevronDown className="h-5 w-5 ml-2" data-testid="chevron-down" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t bg-accent/20 p-4 space-y-4">
          {workflowDetails === undefined ? (
            <div className="text-center py-4">
              <Activity className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading details...</p>
            </div>
          ) : workflowDetails ? (
            <>
              {/* Discovered Sources */}
              {workflowDetails.sources && workflowDetails.sources.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Discovered Sources ({workflowDetails.sources.length})
                  </h5>
                  <div className="space-y-2">
                    {workflowDetails.sources.map((source: any) => (
                      <div key={source._id} className="bg-background p-3 rounded border text-sm">
                        <div className="font-medium">{source.title}</div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-xs mt-1"
                        >
                          {source.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{source.sourceType}</Badge>
                          <span className="text-xs text-muted-foreground">Trust: {source.trustScore}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validated Records */}
              {workflowDetails.validatedRecords && workflowDetails.validatedRecords.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Validated Records ({workflowDetails.validatedRecords.length})
                  </h5>
                  <div className="space-y-2">
                    {workflowDetails.validatedRecords.map((record: any) => (
                      <div key={record._id} className="bg-background p-3 rounded border text-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{record.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">{record.providerName}</div>
                            {record.website && (
                              <a
                                href={record.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-xs mt-1"
                              >
                                {record.website}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {record.serviceTypes.map((type: string) => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {type.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold text-lg">{record.qualityScore.toFixed(1)}/10</div>
                            <div className="text-xs text-muted-foreground">quality</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {workflowDetails.errors && workflowDetails.errors.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Errors ({workflowDetails.errors.length})
                  </h5>
                  <div className="space-y-2">
                    {workflowDetails.errors.map((error: string, idx: number) => (
                      <div key={idx} className="bg-destructive/10 p-3 rounded border border-destructive/20 text-sm">
                        <code className="text-xs">{error}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!workflowDetails.sources || workflowDetails.sources.length === 0) &&
                (!workflowDetails.validatedRecords || workflowDetails.validatedRecords.length === 0) &&
                (!workflowDetails.errors || workflowDetails.errors.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No details available yet</p>
                  </div>
                )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <XCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Failed to load details</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
