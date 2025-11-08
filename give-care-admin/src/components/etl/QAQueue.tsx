import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ExternalLink } from 'lucide-react'

interface QARecord {
  _id: string
  title: string
  providerName: string
  website: string
  serviceTypes: string[]
  qualityScore: number
  validatedAt: number
}

interface QAQueueProps {
  records: QARecord[]
  maxDisplay?: number
}

export function QAQueue({ records, maxDisplay = 5 }: QAQueueProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No records pending QA</p>
      </div>
    )
  }

  const displayRecords = records.slice(0, maxDisplay)
  const remainingCount = records.length - maxDisplay

  return (
    <div className="space-y-3">
      {displayRecords.map((record) => (
        <QARecordCard key={record._id} record={record} />
      ))}
      {remainingCount > 0 && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          + {remainingCount} more records
        </p>
      )}
    </div>
  )
}

function QARecordCard({ record }: { record: QARecord }) {
  const validatedAt = new Date(record.validatedAt)

  return (
    <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{record.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{record.providerName}</p>
          <div className="flex items-center gap-2 mt-2">
            <a
              href={record.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              {record.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {record.serviceTypes.map((type: string) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-lg">{record.qualityScore.toFixed(1)}/10</div>
          <div className="text-xs text-muted-foreground">quality</div>
          <div className="text-xs text-muted-foreground mt-2">
            {validatedAt.toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
