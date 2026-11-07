import { expect, test } from 'claude-code/testing'

const ORIGIN = { kind: 'composer' } as const

test('modo manual, /router y enrutado con >>', async ($, on) => {
  const store = new Map<string, unknown>()
  const logs: string[] = []
  let forks = 0
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('ui.status', () => ({ value: undefined }))
  on('ui.log', (_, e) => {
    logs.push(e.text)
    return { value: undefined }
  })
  on('session.usage', () => ({
    value: { context: { breakdown: { skills: { skillFrontmatter: [{ name: 'marketing:content-creation' }] } } } },
  }))
  on('model.fork', () => {
    forks += 1
    return {
      value: {
        isAnswered: true,
        text: '{"kind":"skill","target":"marketing:content-creation","reason":"contenido para redes","prompt":"Post de Instagram del menú"}',
        usage: {},
      },
    }
  })
  on('prompt.submit', (_, e) => ({ text: e.text }))

  const status = await $.command.run({ command: 'router', args: '', origin: ORIGIN, presentation: { isFullscreen: false, columns: 80 } })
  expect(status.text).toContain('automático')

  await $.command.run({ command: 'router', args: 'manual', origin: ORIGIN, presentation: { isFullscreen: false, columns: 80 } })
  expect(store.get('mode')).toBe('manual')

  const plain = await $.prompt.submit({ text: 'hazme un post', origin: ORIGIN, wait: false })
  expect(forks).toBe(0)
  expect('text' in plain && plain.text).toBe('hazme un post')

  await $.command.run({ command: 'router', args: 'ver', origin: ORIGIN, presentation: { isFullscreen: false, columns: 80 } })
  const routed = await $.prompt.submit({ text: '>> hazme un post', origin: ORIGIN, wait: false })
  expect(forks).toBe(1)
  expect('text' in routed && routed.text).toContain('marketing:content-creation')
  expect(logs.some(l => l.includes('🧭 skill-router: skill · marketing:content-creation'))).toBe(true)
  expect(logs.some(l => l.includes('petición mejorada: Post de Instagram'))).toBe(true)
})
