import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { RouterLast } from '../types'

// ───────────────────────── estado (banda + recordado entre sesiones) ─────────────────────────
const enabled = atom({ plugin: 'skill-router', key: 'enabled' } as const, true)
const autoModel = atom({ plugin: 'skill-router', key: 'autoModel' } as const, true)
const last = atom({ plugin: 'skill-router', key: 'last' } as const, null, { shape: 'last-1' })

// Orígenes que son la propia persona escribiendo (terminal, app, SDK).
const HUMAN = new Set(['composer', 'bridge', 'sdk'])
const SKIP_PREFIX = '--'

type Kind = 'skill' | 'agent' | 'mcp' | 'tool' | 'missing' | 'none'
type Level = RouterLast['level']
type Choice = { kind: Kind; target: string; reason: string; prompt: string; need: string; level: Level }
const KINDS: readonly Kind[] = ['skill', 'agent', 'mcp', 'tool', 'missing', 'none']
const LEVELS: readonly Level[] = ['simple', 'media', 'compleja']

// Modelo y esfuerzo por nivel de complejidad: lo más barato que hace bien la tarea.
const PLAN: Record<Level, { model: string; effort: 'low' | 'medium' | 'high' }> = {
  simple: { model: 'haiku', effort: 'low' },
  media: { model: 'sonnet', effort: 'medium' },
  compleja: { model: 'opus', effort: 'high' },
}

// Peticiones que no merecen ni una llamada al router (0 tokens extra).
const TRIVIAL = /^(hola|gracias|ok|vale|sí|si|no|perfecto|genial|buenas|hey|hi|thanks|yes|continúa|continua|sigue)\b[\s!.?¡¿]*$/i

const ROUTER_RULES = `Eres un enrutador barato. NO respondas la petición: clasifícala.
Objetivo: el mejor resultado gastando los MENOS tokens posibles.
kind:
- "skill": una skill de la lista encaja claramente. target = nombre exacto de la lista.
- "agent": mejor delegarla en un agente (búsqueda amplia en código: "Explore"; planificar: "Plan"). target = tipo.
- "tool": basta una herramienta integrada concreta (WebSearch, Bash...). target = su nombre.
- "missing": tarea especializada y recurrente que ninguna skill de la lista cubre. need = qué falta.
- "none": conversación o tarea normal que no necesita nada especial. Ante la duda, none.
level (complejidad): "simple" (pregunta corta, cambio pequeño, texto breve), "media" (tarea normal de varios pasos),
"compleja" (diseño, arquitectura, depuración difícil, análisis largo, mucho código).
prompt: si kind no es none, la petición reescrita clara y CONCISA (sin relleno, mismo idioma, misma intención); si none, "".
Responde SOLO JSON en una línea:
{"kind":"","target":"","level":"","reason":"<máx 8 palabras>","prompt":"","need":""}`

function parse(text: string): Choice | undefined {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return undefined
  try {
    const j = JSON.parse(m[0])
    const str = (v: unknown) => (typeof v === 'string' && v !== 'null' ? v.trim() : '')
    const kind = KINDS.find(k => k === j.kind)
    if (!kind) return undefined
    return {
      kind,
      target: str(j.target).replace(/^\//, ''),
      level: LEVELS.find(l => l === j.level) ?? 'media',
      reason: str(j.reason),
      prompt: str(j.prompt),
      need: str(j.need),
    }
  } catch {
    return undefined
  }
}

function rewrite(c: Choice, improved: string): string {
  switch (c.kind) {
    case 'skill':
      return `Usa la skill \`${c.target}\` (herramienta Skill) para:\n\n${improved}`
    case 'agent':
      return `Delega en un agente \`${c.target}\` (herramienta Agent) y resume su resultado:\n\n${improved}`
    case 'mcp':
    case 'tool':
      return `Usa \`${c.target}\` para:\n\n${improved}`
    case 'missing':
      return `Ninguna skill instalada cubre esto (falta: ${c.need || 'una skill específica'}). Busca skills populares y seguras (SearchSkills, la skill \`anthropic-skills:find-skills\`), recomiéndame 1-3 sin instalar nada sin mi permiso; si no hay ninguna buena, crea una con \`anthropic-skills:skill-creator\`. Luego:\n\n${improved}`
    default:
      return improved
  }
}

async function skillNames($: EngineInterface): Promise<string[]> {
  try {
    const usage = await $.session.usage({ breakdown: 'summary' })
    return (usage.context.breakdown?.skills?.skillFrontmatter ?? []).map(s => s.name)
  } catch {
    return []
  }
}

async function classify($: EngineInterface, text: string, names: string[]): Promise<Choice | undefined> {
  // Haiku + lista de nombres en caché: unos cientos de tokens por petición.
  const r = await $.model.complete({
    model: 'haiku',
    effort: 'low',
    maxTokens: 600,
    system: [{ text: `${ROUTER_RULES}\n\nSkills instaladas:\n${names.join('\n') || '(ninguna)'}`, cache: true }],
    prompt: text,
  })
  return r.isAnswered ? parse(r.text) : undefined
}

async function setStored($: EngineInterface, key: 'enabled' | 'autoModel', value: boolean): Promise<void> {
  if (key === 'enabled') await update($, enabled, () => value)
  else await update($, autoModel, () => value)
  await $.store.set(key, value)
}

// ───────────────────────── hooks ─────────────────────────
export const register: Register = on => {
  // Modelo/esfuerzo elegidos para la próxima petición del hilo principal.
  let pending: { model: string; effort: 'low' | 'medium' | 'high' } | undefined
  let active: typeof pending
  let lastModel: string | undefined

  on('session.start', async ($, e, next) => {
    const en = await $.store.get('enabled')
    const am = await $.store.get('autoModel')
    if (typeof en === 'boolean') await update($, enabled, () => en)
    if (typeof am === 'boolean') await update($, autoModel, () => am)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const text = e.text.trim()
    if (e.command || e.isMeta || !HUMAN.has(e.origin.kind) || !text || text.startsWith('/')) return next(e)
    if (!(await read($, enabled))) return next(e)
    if (text.startsWith(SKIP_PREFIX)) return next({ ...e, text: text.slice(SKIP_PREFIX.length).trim() })
    if (TRIVIAL.test(text)) return next(e)

    let choice: Choice | undefined
    let names: string[] = []
    try {
      names = await skillNames($)
      choice = await classify($, text, names)
    } catch {
      return next(e)
    }
    if (!choice) return next(e)

    const known = (s: string) => !names.length || names.includes(s) || names.some(n => n.endsWith(`:${s}`))
    if (choice.kind === 'skill' && !known(choice.target)) choice = { ...choice, kind: 'missing', need: choice.need || choice.target }
    if ((choice.kind === 'skill' || choice.kind === 'agent' || choice.kind === 'tool' || choice.kind === 'mcp') && !choice.target) {
      choice = { ...choice, kind: 'none' }
    }

    const plan = PLAN[choice.level]
    const useAuto = await read($, autoModel)
    pending = useAuto ? plan : undefined
    const what = choice.kind === 'none' ? 'sin skill' : choice.kind === 'missing' ? `falta: ${choice.need || 'skill'}` : choice.target
    const info: RouterLast = {
      what,
      reason: choice.reason,
      level: choice.level,
      model: useAuto ? plan.model : 'el tuyo',
      effort: useAuto ? plan.effort : '',
    }
    await update($, last, () => info)
    $.ui.log(`🧭 ${what} · ${choice.level} → ${useAuto ? `${plan.model}/${plan.effort}` : `recomendado ${plan.model}`} · ${choice.reason}`)

    if (choice.kind === 'none') return next(e)
    return next({
      ...e,
      text: rewrite(choice, choice.prompt || text),
      context: [...(e.context ?? []), `Petición original del usuario:\n${text}`],
    })
  })

  on('turn.start', async ($, e, next) => {
    if (!e.agentId) {
      active = pending
      pending = undefined
    }
    return next(e)
  })

  // Aplica el modelo y el esfuerzo elegidos a cada paso del hilo principal de ese turno.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId || !active) return yield* next(e)
    if (active.model !== lastModel) lastModel = active.model
    return yield* next({ ...e, model: active.model, effort: active.effort })
  })

  on('turn.complete', async ($, e, next) => {
    active = undefined
    return next(e)
  })

  // Banda encima del cuadro de texto: estado, última elección y dos botones.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const on_ = await read($, enabled)
    const am = await read($, autoModel)
    const l = await read($, last)
    return (
      <Box flexDirection="row" gap={1}>
        <Button key="toggle" label={on_ ? '🧭 Router: ON' : '🧭 Router: OFF'} onPress={() => setStored($, 'enabled', !on_)} />
        {on_ && <Button key="model" label={am ? 'Modelo: auto' : 'Modelo: el mío'} onPress={() => setStored($, 'autoModel', !am)} />}
        {on_ && l && (
          <Text dimColor wrap="truncate-end">
            {l.what} · {l.level} → {l.model}
            {l.effort ? `/${l.effort}` : ''}
          </Text>
        )}
      </Box>
    )
  })
}
