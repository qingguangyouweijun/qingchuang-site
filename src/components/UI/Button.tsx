import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
          {
            'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/80 hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-0.5': variant === 'primary',
            'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-200/80 hover:shadow-xl hover:shadow-sky-200 hover:-translate-y-0.5': variant === 'secondary',
            'border border-emerald-200 bg-white/85 hover:bg-emerald-50 text-emerald-800': variant === 'outline',
            'hover:bg-emerald-50/80 text-emerald-700 hover:text-emerald-900': variant === 'ghost',
            'bg-white/70 backdrop-blur-md border border-white/70 text-slate-700 hover:bg-white/90 shadow-sm hover:shadow-md': variant === 'glass',

            'h-8 px-4 text-xs': size === 'sm',
            'h-11 px-6 text-sm': size === 'md',
            'h-14 px-8 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
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
Button.displayName = 'Button'

export { Button }