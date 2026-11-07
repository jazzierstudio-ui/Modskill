# skill-router

Mod de Claude Code que saca el mejor resultado de cada petición gastando los mínimos tokens. Todo es automático: solo hay un botón para encenderlo o apagarlo.

## Cómo se ve

Una **banda encima del cuadro de texto** (no es un panel aparte ni va dentro del mensaje):

```
[🧭 Router: ON]  [Modelo: auto]   marketing:content-creation · simple → haiku/low
╭──────────────────────────────────────────────╮
│ > escribe aquí tu petición                    │
╰──────────────────────────────────────────────╯
```

- **🧭 Router: ON / OFF**: enciende o apaga el mod. Se recuerda entre sesiones.
- **Modelo: auto / el mío**: en *auto* elige el modelo según la complejidad; en *el mío* usa tu modelo y solo te dice cuál recomendaría.
- A la derecha, la última elección: skill o herramienta · complejidad → modelo/esfuerzo.

Y en la conversación, encima de la respuesta, una línea gris con lo mismo y el motivo.

## Qué hace en cada petición

1. **Filtro gratis**: saludos y respuestas cortas («gracias», «ok», «sigue») pasan sin gastar nada.
2. **Clasifica con Haiku** (unos cientos de tokens, con la lista de skills en caché): tipo de tarea, la mejor skill / agente / herramienta y la complejidad.
3. **Mejora la petición**: la reescribe clara y concisa, sin cambiar la intención.
4. **Elige el modelo** (con *Modelo: auto*): simple → Haiku (esfuerzo bajo), media → Sonnet (medio), compleja → Opus (alto). Solo para ese turno.
5. **Si falta una skill**: busca skills populares y seguras, te recomienda 1-3 sin instalar nada y, si no hay ninguna buena, crea una.

Empieza una petición con `--` para saltarte el router una vez.

Nota: cambiar de modelo entre turnos obliga a volver a leer el contexto en el nuevo modelo. En conversaciones muy largas puede salir más barato poner *Modelo: el mío*.

## Instalación

En la terminal:

```
claude plugin install skill-router --marketplace jazzierstudio-ui/modskill
```

Para actualizar: `claude plugin update skill-router`.
