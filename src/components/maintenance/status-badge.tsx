import { STATUS_LABELS } from "@/lib/domain/labels"
import type { DueStatus } from "@/lib/domain/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const STATUS_CLASS: Record<DueStatus, string> = {
  overdue: "bg-destructive/15 text-destructive",
  due: "bg-orange-500/15 text-orange-200",
  soon: "bg-primary/15 text-primary",
  ok: "bg-emerald-500/15 text-emerald-200",
  unset: "bg-muted text-muted-foreground",
}

export function StatusBadge({ status }: { status: DueStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0", STATUS_CLASS[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
