import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            "bg-gradient-to-r from-amber-400 to-emerald-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-0.5": variant === "primary",
            "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-200 hover:shadow-xl hover:shadow-cyan-200 hover:-translate-y-0.5": variant === "secondary",
            "border border-amber-200 bg-transparent hover:bg-amber-50 text-amber-800": variant === "outline",
            "hover:bg-sky-50/70 text-sky-700 hover:text-sky-900": variant === "ghost",
            "bg-white/55 backdrop-blur-md border border-white/60 text-gray-700 hover:bg-white/75 shadow-sm hover:shadow-md": variant === "glass",

            "h-8 px-4 text-xs": size === "sm",
            "h-11 px-6 text-sm": size === "md",
            "h-14 px-8 text-base": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
