# skill-router

Mod de Claude Code con un hook `prompt.submit` que, antes de procesar cada petición que escribes:

1. Pregunta a un modelo (un *fork* de la sesión, que ve el listado completo de skills instaladas con sus descripciones; en la primera petición, `haiku` con los nombres de las skills) cuál es la skill que mejor encaja.
2. Si hay una, reescribe la petición mejorada y la envía indicando a Claude que invoque esa skill con la herramienta Skill. La petición original va adjunta como contexto.
3. Si no encaja ninguna, la petición sigue tal cual.

En el transcript aparece una línea como:

```
🧭 skill-router: seal-copilot:diagnose-drop · pregunta por la causa de una caída de conversiones
```

Para saltarte el router en una petición, empiézala con `--`. Los comandos `/...` nunca se enrutan.
