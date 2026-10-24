import type { Ref } from 'react'
import type { InputProps } from './Input'
import { Input } from './Input'
import { Label } from './Label'
import { ValidationMessage } from './ValidationMessage'

interface FormFieldProps extends Omit<InputProps, 'id' | 'invalid' | 'aria-describedby'> {
  id: string
  label: string
  hint?: string
  error?: string
  inputRef?: Ref<HTMLInputElement>
}

/**
 * Combines a label, input, optional hint, and validation message.
 * It also connects the input to its accessible description and error.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  required,
  className = '',
  inputRef,
  ...inputProps
}: FormFieldProps) {
  const describedBy = [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={['grid gap-1.5', className].join(' ')}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      <Input
        ref={inputRef}
        {...inputProps}
        id={id}
        required={required}
        invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
      />

      {hint && (
        <p id={`${id}-hint`} className="text-supporting text-text-secondary">
          {hint}
        </p>
      )}

      {error && <ValidationMessage id={`${id}-error`}>{error}</ValidationMessage>}
    </div>
  )
}
