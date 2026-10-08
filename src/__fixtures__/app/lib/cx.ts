// Like the real app's sortCx: returns its input with the same type
export function sortCx<T extends Record<string, unknown>>(classes: T): T {
  return classes
}
