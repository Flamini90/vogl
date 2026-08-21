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
      ? "h-16 min-w-[17rem] text-3xl tracking-[0.18em]"
      : size === "sm"
        ? "h-8 min-w-[9.5rem] text-xs tracking-[0.16em]"
        : "h-11 min-w-[13rem] text-lg tracking-[0.18em]"

  return (
    <div
      className={cn(
        "inline-flex overflow-hidden rounded-md border border-neutral-400 bg-[#f4f1ea] font-semibold text-neutral-950 shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
        sizeClass,
        className,
      )}
    >
      <div className="flex w-[18%] flex-col items-center justify-between bg-[#1d4f91] py-1 text-[8px] font-bold tracking-wide text-white">
        <span className="text-[9px]">★</span>
        <span>I</span>
      </div>
      <div className="flex flex-1 items-center justify-center px-3 font-heading">
        {formatted || "— — —"}
      </div>
    </div>
  )
}
