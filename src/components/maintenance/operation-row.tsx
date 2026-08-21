import { formatDueSummary, type DueProjection } from "@/lib/domain/due"
import { CATEGORY_LABELS } from "@/lib/domain/labels"
import { StatusBadge } from "@/components/maintenance/status-badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function OperationRow({
  projection,
  onComplete,
  onEdit,
}: {
  projection: DueProjection
  onComplete?: () => void
  onEdit?: () => void
}) {
  return (
    <div className="rounded-2xl bg-card/70 p-4 ring-1 ring-white/8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{projection.operation.name}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {CATEGORY_LABELS[projection.operation.category]}
          </p>
        </div>
        <StatusBadge status={projection.status} />
      </div>
      <p className="mt-3 text-sm">{formatDueSummary(projection)}</p>
      <Progress value={Math.round(projection.progress * 100)} className="mt-3" />
      <div className="mt-4 flex gap-2">
        {onComplete ? (
          <Button size="sm" onClick={onComplete}>
            Segna come fatto
          </Button>
        ) : null}
        {onEdit ? (
          <Button size="sm" variant="outline" onClick={onEdit}>
            Modifica
          </Button>
        ) : null}
      </div>
    </div>
  )
}
