import type { ButtonHTMLAttributes } from 'react'
import { styles } from '@/lib/styles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Size, typed through an aliased import */
  size?: keyof typeof styles.sizes
}

/** Button whose props come from an @/ alias and HTML attributes. */
export function Button({ size = 'sm', children, ...rest }: ButtonProps) {
  return <button className={styles.sizes[size]} {...rest}>{children}</button>
}
