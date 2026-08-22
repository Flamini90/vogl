import { formatPlate } from "@/lib/domain/plate"
import { cn } from "@/lib/utils"

export function LicensePlate({
  plate,
  size = "md",
  className,
}: {
  plate: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const formatted = formatPlate(plate)
  const sizeClass =
    size === "lg"
      ? "h-16 text-2xl tracking-[0.14em] sm:text-[1.75rem]"
      : size === "sm"
        ? "h-8 text-xs tracking-[0.12em]"
        : "h-11 text-lg tracking-[0.12em]"

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[22rem] shrink-0 overflow-hidden rounded-md border border-neutral-400 bg-[#f4f1ea] font-semibold text-neutral-950 shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
        sizeClass,
        className,
      )}
    >
      <div className="flex w-8 shrink-0 flex-col items-center justify-between bg-[#1d4f91] py-0.5 text-[8px] font-bold tracking-wide text-white">
        <span className="text-[9px]">★</span>
        <span>I</span>
      </div>
      <div className="flex flex-1 items-center justify-center whitespace-nowrap px-2 font-heading">
        {formatted || "— — —"}
      </div>
    </div>
  )
}
