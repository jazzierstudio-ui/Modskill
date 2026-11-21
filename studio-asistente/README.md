# studio-asistente

Tu asistente para todo el estudio: redes sociales, sesiones, clientes, SEO, métricas, vídeo, diseño y cámara.

## Qué hace

| Área | Skill | Ejemplos |
|---|---|---|
| Tendencias y plan semanal | `tendencias-semana` | «¿Qué publico esta semana?», «audios virales», «qué estilo gráfico se lleva» |
| Sesiones | `ideas-sesion` | «Idea para una sesión de pareja en otoño», «shot list para producto» |
| Consultas de la web | `consultas-web` | «Revisa las consultas», «responde a este cliente», «presupuesto» |
| SEO y métricas | `metricas-seo` | «¿Qué funciona con mi comunidad?», «auditoría SEO de mi web» |
| Coach de contenido | `coach-contenido` | «Revisa este reel», «cómo mejoro mi feed» |
| Editor de vídeo | `editor-video` | «Pásalo a vertical y subtítulalo», «guion para un reel» |
| Diseñador | `disenador` | «Carrusel con 5 tips de luz», «portada del reel» |
| Cámara | `camara` | «Ajustes para una boda en una iglesia oscura» |

El agente `asistente-estudio` coordina todo y elige la skill adecuada.

## Comandos

- `/semana` — repaso semanal: consultas pendientes, agenda, métricas frente a la semana pasada, tendencias, plan de contenido, un consejo y las 3 prioridades.
- `/estudio <petición>` — cualquier otra cosa.

## Memoria

La primera vez te hará unas preguntas (estudio, web, redes, cámara, programa de edición, objetivos). Lo guarda en `~/.studio-asistente/` junto con los planes semanales, las revisiones de métricas, el registro de consultas y los aprendizajes, para que cada semana compare con la anterior.

## Conectores recomendados

Gmail y Google Calendar (consultas y agenda), Google Drive (presupuestos), Canva o Figma (diseño). Sin conectores también funciona: pega emails, sube capturas de métricas o vídeos. Para editar vídeo directamente hace falta `ffmpeg`.

Nunca envía emails, publica ni crea eventos sin tu confirmación, y no inventa métricas.

## Instalación

```
claude plugin install studio-asistente --marketplace jazzierstudio-ui/modskill
```

Para que haga el repaso solo cada lunes, pídele en una sesión: «programa /semana cada lunes a las 9».
