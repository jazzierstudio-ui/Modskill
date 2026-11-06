import type { Register } from 'claude-code'

// Orígenes que son la propia persona escribiendo (terminal, app, SDK).
const HUMAN = new Set(['composer', 'bridge', 'sdk'])
// Empieza la petición con "--" para saltarte el router en esa petición.
const SKIP_PREFIX = '--'

type Kind = 'skill' | 'agent' | 'mcp' | 'tool' | 'missing' | 'none'
type Choice = { kind: Kind; target: string; reason: string; prompt: string; need: string }
const KINDS: readonly Kind[] = ['skill', 'agent', 'mcp', 'tool', 'missing', 'none']

const ROUTER_INSTRUCTIONS = `Eres un enrutador. NO respondas a la petición: solo decide cómo obtener el mejor resultado.
En tu contexto tienes todo lo disponible: skills (con descripciones), tipos de agente, herramientas MCP de los conectores y herramientas integradas.
Elige UNA opción para la petición del usuario:
- "skill": una skill instalada encaja claramente. target = su nombre exacto.
- "agent": la resuelve mejor un tipo de agente concreto. target = su nombre exacto.
- "mcp": la resuelve mejor un conector MCP conectado. target = el servidor o herramienta (mcp__...).
- "tool": basta con una herramienta integrada concreta (WebSearch, Bash, Artifact...). target = su nombre.
- "missing": es una tarea especializada que merece una skill y NINGUNA instalada la cubre. target = "". need = la capacidad que falta, en pocas palabras.
- "none": conversación, preguntas simples o ya se resuelve bien sin nada especial. Ante la duda entre none y otra, none.
En todos los casos salvo "none", reescribe la petición mejorada: más clara, concreta y completa, en el mismo idioma,
sin inventar datos ni cambiar la intención.
Responde SOLO con JSON en una línea, sin markdown:
{"kind": "...", "target": "...", "reason": "<por qué, máx 12 palabras>", "prompt": "<petición mejorada o \\"\\">", "need": "<solo en missing>"}`

function parse(text: string): Choice | undefined {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return undefined
  try {
    const j = JSON.parse(m[0])
    const kind = KINDS.find(k => k === j.kind) ?? (typeof j.skill === 'string' ? 'skill' : undefined)
    if (!kind) return undefined
    const str = (v: unknown) => (typeof v === 'string' && v !== 'null' ? v.trim() : '')
    return {
      kind,
      target: str(j.target ?? j.skill).replace(/^\//, ''),
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
      return `Usa la skill \`${c.target}\` (invócala primero con la herramienta Skill) para esta petición:\n\n${improved}`
    case 'agent':
      return `Delega esta petición en un agente de tipo \`${c.target}\` (herramienta Agent) y resúmeme su resultado:\n\n${improved}`
    case 'mcp':
      return `Usa el conector MCP \`${c.target}\` (cárgalo con ToolSearch si hace falta) para esta petición:\n\n${improved}`
    case 'tool':
      return `Usa la herramienta \`${c.target}\` para esta petición:\n\n${improved}`
    default:
      return `Ninguna skill instalada cubre esta tarea (falta: ${c.need || 'una skill específica'}). Antes de hacerla:
1. Busca skills populares y seguras para ella: SearchSkills/SuggestSkills, la skill \`anthropic-skills:find-skills\` y, si hace falta, WebSearch. Prioriza fuentes oficiales o muy usadas, mantenidas y con código legible; descarta las que pidan credenciales innecesarias, ejecuten código remoto o no tengan fuente clara.
2. Recomiéndame las 1-3 mejores en una lista breve (nombre, para qué, por qué es fiable, cómo instalarla). No instales nada sin mi confirmación.
3. Si no hay ninguna buena, crea una skill específica para la tarea con la skill \`anthropic-skills:skill-creator\` y úsala.
Después ejecuta la petición:

${improved}`
  }
}

const LABEL: Record<Kind, string> = {
  skill: 'skill',
  agent: 'agente',
  mcp: 'conector',
  tool: 'herramienta',
  missing: 'falta skill',
  none: 'ninguna',
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const text = e.text.trim()
    if (e.command || e.isMeta || !HUMAN.has(e.origin.kind) || !text || text.startsWith('/')) return next(e)
    if (text.startsWith(SKIP_PREFIX)) return next({ ...e, text: text.slice(SKIP_PREFIX.length).trim() })

    // Nombres de las skills instaladas, para validar la elección.
    let names: string[] = []
    try {
      const usage = await $.session.usage({ breakdown: 'summary' })
      names = (usage.context.breakdown?.skills?.skillFrontmatter ?? []).map(s => s.name)
    } catch {}

    const ask = `${ROUTER_INSTRUCTIONS}\n\nPetición del usuario:\n<<<\n${text}\n>>>`
    let reply: string | undefined
    // 1) fork: ve skills, agentes, conectores y herramientas, servido desde la caché.
    const forked = await $.model.fork({ prompt: ask, effort: 'low' })
    if (forked.isAnswered) reply = forked.text
    // 2) primera petición de la sesión: solo nombres de skills, con un modelo rápido.
    else if (names.length) {
      const r = await $.model.complete({
        model: 'haiku',
        effort: 'low',
        maxTokens: 1500,
        prompt: `${ROUTER_INSTRUCTIONS}\n\nSkills instaladas:\n${names.join('\n')}\n\nPetición del usuario:\n<<<\n${text}\n>>>`,
      })
      if (r.isAnswered) reply = r.text
    }

    let choice = reply ? parse(reply) : undefined
    const known = (s: string) => !names.length || names.includes(s) || names.some(n => n.endsWith(`:${s}`))
    // Una skill que no existe es, en realidad, una skill que falta.
    if (choice?.kind === 'skill' && !known(choice.target)) {
      choice = { ...choice, kind: 'missing', need: choice.need || choice.target, target: '' }
    }
    if (choice && choice.kind !== 'missing' && choice.kind !== 'none' && !choice.target) choice = undefined

    if (!choice || choice.kind === 'none') {
      $.ui.log(`🧭 skill-router: ninguna · ${choice?.reason || 'no hace falta nada especial'} → sigue normal`)
      return next(e)
    }

    const what = choice.kind === 'missing' ? choice.need || 'skill específica' : choice.target
    const icon = choice.kind === 'missing' ? '🔎' : '🧭'
    $.ui.log(`${icon} skill-router: ${LABEL[choice.kind]} · ${what} · ${choice.reason}`)
    return next({
      ...e,
      text: rewrite(choice, choice.prompt || text),
      context: [...(e.context ?? []), `Petición original del usuario, antes de que skill-router la reescribiera:\n${text}`],
    })
  })
}
