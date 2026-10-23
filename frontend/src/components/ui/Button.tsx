import { forwardRef, type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger'
export type ButtonSize = 'small' | 'medium'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-surface hover:bg-primary/90',
  secondary: 'bg-secondary text-primary hover:bg-secondary/80',
  outline: 'border border-border bg-surface text-text-primary hover:bg-page',
  danger: 'bg-error text-surface hover:bg-error/90',
}

const sizeClasses: Record<ButtonSize, string> = {
  small: 'px-3 py-1.5 text-supporting',
  medium: 'px-4 py-2 text-body',
}

/**
 * Renders a button using the shared design-system variants and sizes.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'medium', type = 'button', className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-disabled-background',
        'disabled:text-disabled-text',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    />
  )
})
