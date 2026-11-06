# skill-router

Mod de Claude Code con un hook `prompt.submit` cuya misión es sacar el mejor resultado de cada petición. Antes de procesarla:

1. **Mejora la petición**: la reescribe más clara y completa, sin cambiar la intención.
2. **Elige la mejor herramienta**: una skill instalada, un tipo de agente, un conector MCP o una herramienta integrada. Lo decide un *fork* de la sesión, que ve todo lo disponible con sus descripciones; en la primera petición, `haiku` con los nombres de las skills.
3. **Si falta una skill**: pide a Claude que busque skills populares y seguras para la tarea, te recomiende 1-3 (sin instalar nada sin tu confirmación) y, si no hay ninguna buena, cree una específica con `skill-creator`.
4. Si no hace falta nada especial, la petición sigue tal cual.

En el transcript aparece una línea como:

```
🧭 skill-router: skill · seal-copilot:diagnose-drop · pregunta por la causa de una caída
🔎 skill-router: falta skill · conversión de facturas a CSV · ninguna skill instalada lo cubre
🧭 skill-router: ninguna · conversación general → sigue normal
```

Empieza una petición con `--` para saltarte el router. Los comandos `/...` nunca se enrutan.
