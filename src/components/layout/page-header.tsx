export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-muted-foreground mb-1 text-[11px] tracking-[0.22em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-3xl leading-none tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  )
}
