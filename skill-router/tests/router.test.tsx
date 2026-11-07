import { expect, test } from 'claude-code/testing'

const ORIGIN = { kind: 'composer' } as const
const BAND = {
  plugin: 'skill-router',
  component: 'AbovePrompt',
  requestId: 'band',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

test('botón ON/OFF, enrutado y modelo automático', async ($, on) => {
  const store = new Map<string, unknown>()
  const logs: string[] = []
  const steps: { model: string; effort?: unknown }[] = []
  let calls = 0
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('ui.log', (_, e) => {
    logs.push(e.text)
    return { value: undefined }
  })
  on('session.usage', () => ({
    value: { context: { breakdown: { skills: { skillFrontmatter: [{ name: 'marketing:content-creation' }] } } } } as never,
  }))
  on('model.complete', () => {
    calls += 1
    return {
      value: {
        isAnswered: true,
        text: '{"kind":"skill","target":"marketing:content-creation","level":"simple","reason":"post para redes","prompt":"Post de Instagram del menú","need":""}',
        usage: {},
      } as never,
    }
  })
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.step', async function* (_, e) {
    steps.push({ model: e.model, effort: e.effort })
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] } as never
  })

  // Trivial: ni una llamada.
  await $.prompt.submit({ text: 'gracias', origin: ORIGIN, wait: false })
  expect(calls).toBe(0)

  const routed = await $.prompt.submit({ text: 'hazme un post', origin: ORIGIN, wait: false })
  expect(calls).toBe(1)
  expect('text' in routed && routed.text).toContain('marketing:content-creation')
  expect(logs.some(l => l.includes('marketing:content-creation · simple → haiku/low'))).toBe(true)

  await $.turn.start({ text: '', turnId: 't1' })
  for await (const _ of $.turn.step({ turnId: 't1', index: 0, model: 'opus', messageCount: 1 } as never)) {
  }
  expect(steps[0]?.model).toBe('haiku')

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const btn = await ui.find({ type: 'Button', key: 'toggle' })
  expect(btn?.props.label).toBe('🧭 Router: ON')
  await ui.press({ key: 'toggle' })
  expect(store.get('enabled')).toBe(false)
  await ui.unmount()

  await $.prompt.submit({ text: 'otro post', origin: ORIGIN, wait: false })
  expect(calls).toBe(1)
})
