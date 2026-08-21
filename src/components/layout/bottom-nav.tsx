import Link from "next/link"
import { Bell, Car, Plus, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/", label: "Garage", icon: Car, primary: false },
  { href: "/reminders", label: "Scadenze", icon: Bell, primary: false },
  { href: "/vehicles/new", label: "Aggiungi", icon: Plus, primary: true },
  { href: "/settings", label: "Impostazioni", icon: Settings, primary: false },
] as const

export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-background/80 px-3 pt-2 backdrop-blur-xl"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] tracking-wide",
                  item.primary
                    ? "bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(232,184,109,0.24)]"
                    : active
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
