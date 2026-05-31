import React from 'react'

export interface ButtonProps {
  /** The label displayed inside the button */
  label: string
  /** Controls the visual style of the button */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Whether the button is non-interactive */
  disabled?: boolean
  /** Callback fired when the button is clicked */
  onClick?: () => void
}

/**
 * A basic button component.
 */
export const Button = ({ label, variant = 'primary', disabled = false, onClick }: ButtonProps) => {
  return (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {label}
    </button>
  )
}