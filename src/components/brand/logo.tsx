import { BRAND } from "@/lib/brand"
import { cn } from "@/lib/utils"

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold tracking-[0.18em] text-primary-foreground">
        V
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-lg tracking-[0.28em]">{BRAND.name}</span>
        {compact ? null : (
          <span className="text-muted-foreground mt-1 text-[10px] tracking-[0.18em] uppercase">
            {BRAND.acronym}
          </span>
        )}
      </span>
    </div>
  )
}
