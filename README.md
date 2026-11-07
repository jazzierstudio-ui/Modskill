# skill-router

Mod de Claude Code con un hook `prompt.submit` cuya misión es sacar el mejor resultado de cada petición. Antes de procesarla:

1. **Mejora la petición**: la reescribe más clara y completa, sin cambiar la intención.
2. **Elige la mejor herramienta**: una skill instalada, un tipo de agente, un conector MCP o una herramienta integrada. Lo decide un *fork* de la sesión, que ve todo lo disponible con sus descripciones; en la primera petición, `haiku` con los nombres de las skills.
3. **Si falta una skill**: pide a Claude que busque skills populares y seguras para la tarea, te recomiende 1-3 (sin instalar nada sin tu confirmación) y, si no hay ninguna buena, cree una específica con `skill-creator`.
4. Si no hace falta nada especial, la petición sigue tal cual.

## Cómo se ve

Encima de la respuesta aparece una línea gris, y la barra de estado muestra el modo y la última elección:

```
🧭 skill-router: skill · seal-copilot:diagnose-drop · pregunta por la causa de una caída
   ↳ petición mejorada: ...            (solo con /router ver)
🔎 skill-router: falta skill · conversión de facturas a CSV · ninguna instalada lo cubre
🧭 skill-router: ninguna · conversación general → sigue normal
```

## Comandos y modos

| Comando | Qué hace |
| --- | --- |
| `/router` | estado y ayuda |
| `/router auto` (o `on`) | enruta todas las peticiones (modo por defecto) |
| `/router manual` | solo enruta las que empiezan con `>>` |
| `/router off` | lo apaga |
| `/router ver` | muestra también la petición mejorada (otra vez para ocultarla) |
| `/router skills` o `/skills-sugeridas` | las skills instaladas más útiles para el proyecto actual, cuándo usarlas y una frase de ejemplo |

Prefijos: `>>` fuerza el enrutado en cualquier modo; `--` lo salta en modo automático. Los comandos `/...` nunca se enrutan. El modo elegido se recuerda entre sesiones.

## Instalación

En la terminal de Claude Code:

```
/plugin install skill-router --marketplace jazzierstudio-ui/modskill
```

Desde una shell:

```
claude plugin install skill-router --marketplace jazzierstudio-ui/modskill
```

En la app de escritorio: pulsa + junto al cuadro de texto → Plugins → Add marketplace con `jazzierstudio-ui/modskill` → Add plugin.

Responde `y` a "Add marketplace?" y elige el ámbito *user* para tenerlo en todas tus sesiones.
