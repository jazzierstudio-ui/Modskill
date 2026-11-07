export type RouterLast = {
  what: string
  reason: string
  level: 'simple' | 'media' | 'compleja'
  model: string
  effort: string
}

declare module 'claude-code' {
  interface PluginState {
    'skill-router': { enabled: boolean; autoModel: boolean; last: Shaped<RouterLast | null> }
  }
}
