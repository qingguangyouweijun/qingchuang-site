import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-amber-500 text-white hover:bg-amber-600": variant === "default",
          "border-transparent bg-sky-100 text-sky-900 hover:bg-sky-200": variant === "secondary",
          "border-transparent bg-red-100 text-red-900 hover:bg-red-200": variant === "destructive",
          "border-transparent bg-emerald-100 text-emerald-900 hover:bg-emerald-200": variant === "success",
          "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-200": variant === "warning",
          "border-amber-200 text-amber-800 bg-white/70": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
