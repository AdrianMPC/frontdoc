// What next-env.d.ts / @types/node provide in a real app
declare module '*.css'
declare const process: { env: Record<string, string | undefined> }
