import { createFileRoute } from '@tanstack/react-router'
import { TraceViewerDemo } from '@/components/traces/TraceViewerDemo'

export const Route = createFileRoute('/traces')({
  component: TracesPage,
})

function TracesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Execution Traces</h1>
      <TraceViewerDemo />
    </div>
  )
}
