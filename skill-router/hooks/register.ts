import type { Register } from 'claude-code'

// Orígenes que son la propia persona escribiendo (terminal, app, SDK).
const HUMAN = new Set(['composer', 'bridge', 'sdk'])
// Empieza la petición con "--" para saltarte el router en esa petición.
const SKIP_PREFIX = '--'

type Choice = { skill: string | null; reason: string; prompt: string }

const ROUTER_INSTRUCTIONS = `Eres un enrutador de skills. NO respondas a la petición: solo decide.
Tienes la lista de skills disponibles (con sus descripciones) en tu contexto.
Elige la UNA skill instalada que mejor encaje con la petición del usuario, o null si ninguna encaja claramente
(conversación general, preguntas simples, tareas que ninguna skill cubre). Ante la duda, null.
Si eliges una skill, reescribe la petición mejorada: más clara, concreta y completa, en el mismo idioma,
sin inventar datos ni cambiar la intención.
Responde SOLO con JSON en una línea, sin markdown:
{"skill": "<nombre exacto de la skill o null>", "reason": "<por qué, máx 12 palabras>", "prompt": "<petición mejorada, o \\"\\" si skill es null>"}`

function parse(text: string): Choice | undefined {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return undefined
  try {
    const j = JSON.parse(m[0])
    const skill = typeof j.skill === 'string' && j.skill.trim() && j.skill !== 'null' ? j.skill.trim().replace(/^\//, '') : null
    return { skill, reason: String(j.reason ?? '').trim(), prompt: String(j.prompt ?? '').trim() }
  } catch {
    return undefined
  }
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
    // 1) fork: ve el listado completo de skills con descripciones, servido desde la caché.
    const forked = await $.model.fork({ prompt: ask, effort: 'low' })
    if (forked.isAnswered) reply = forked.text
    // 2) primera petición de la sesión: solo nombres, con un modelo rápido.
    else if (names.length) {
      const r = await $.model.complete({
        model: 'haiku',
        effort: 'low',
        maxTokens: 1500,
        prompt: `${ROUTER_INSTRUCTIONS}\n\nSkills instaladas:\n${names.join('\n')}\n\nPetición del usuario:\n<<<\n${text}\n>>>`,
      })
      if (r.isAnswered) reply = r.text
    }

    const choice = reply ? parse(reply) : undefined
    const known = (s: string) => !names.length || names.includes(s) || names.some(n => n.endsWith(`:${s}`))

    if (!choice || !choice.skill || !known(choice.skill)) {
      $.ui.log(`🧭 skill-router: ninguna skill · ${choice?.reason || 'ninguna encaja'} → sigue normal`)
      return next(e)
    }

    const improved = choice.prompt || text
    $.ui.log(`🧭 skill-router: ${choice.skill} · ${choice.reason}`)
    return next({
      ...e,
      text: `Usa la skill \`${choice.skill}\` (invócala primero con la herramienta Skill) para esta petición:\n\n${improved}`,
      context: [...(e.context ?? []), `Petición original del usuario, antes de que skill-router la reescribiera:\n${text}`],
    })
  })
}
