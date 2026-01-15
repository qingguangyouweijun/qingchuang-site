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
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            // Variants
            "bg-gradient-to-r from-rose-400 to-rose-600 text-white shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 hover:-translate-y-0.5": variant === "primary",
            "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5": variant === "secondary",
            "border border-rose-200 bg-transparent hover:bg-rose-50 text-rose-700": variant === "outline",
            "hover:bg-rose-50/50 text-rose-700 hover:text-rose-900": variant === "ghost",
            "bg-white/40 backdrop-blur-md border border-white/50 text-gray-700 hover:bg-white/60 shadow-sm hover:shadow-md": variant === "glass",
            
            // Sizes
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
