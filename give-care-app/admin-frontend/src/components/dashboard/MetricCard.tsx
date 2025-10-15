import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = 'default'
}: MetricCardProps) {
  const colorClasses = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className={cn('p-2 rounded-lg bg-accent', colorClasses[color])}>
              {icon}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className={cn('text-2xl font-bold', colorClasses[color])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
