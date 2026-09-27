import React from 'react'

export interface CardProps {
  /** Heading shown at the top of the card */
  title: string
  /** Size of the card */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * A simple card container.
 */
export const Card = ({ title, size = 'md' }: CardProps) => {
  return <section data-size={size}><h2>{title}</h2></section>
}
