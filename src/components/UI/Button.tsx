import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: Pick<ButtonProps, 'variant' | 'size' | 'className'>) {
  return cn(
    'inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-emerald-700 text-white hover:bg-emerald-800': variant === 'primary',
      'bg-slate-800 text-white hover:bg-slate-900': variant === 'secondary',
      'border border-slate-300 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800': variant === 'outline',
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
      'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-white': variant === 'glass',

      'h-9 px-4 text-xs': size === 'sm',
      'h-11 px-6 text-sm': size === 'md',
      'h-12 px-6 text-base': size === 'lg',
      'h-10 w-10 p-0': size === 'icon',
    },
    className
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, asChild, children, ...props }, ref) => {
    const classes = buttonClassName({ variant, size, className })

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(classes, (children.props as { className?: string }).className),
      })
    }

    return (
      <button
        ref={ref}
        className={classes}
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
