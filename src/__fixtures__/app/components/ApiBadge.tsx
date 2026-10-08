/** Shows the API URL from a public env variable. */
export function ApiBadge({ label }: { /** Prefix text */ label: string }) {
  return <span>{label}: {process.env.NEXT_PUBLIC_API_URL}</span>
}
