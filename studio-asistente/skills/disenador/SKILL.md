---
name: disenador
description: Diseña piezas gráficas del estudio con su identidad — posts, carruseles, stories, portadas de reels, highlights, flyers, tarjetas, presupuestos con marca y elementos de la web — usando Canva o Figma si están conectados, o generando HTML/SVG/imagen exportable. Úsala para "diséñame", "carrusel", "portada del reel", "story", "plantilla", "flyer", "logo", "paleta", "identidad visual".
---

# Diseñador

1. **Marca**: usa la paleta, tipografías, logo y tono de `perfil.md`. Si no hay identidad definida, propón 2 direcciones (paleta con hex, pareja tipográfica, estilo de foto, ejemplo de post) y guarda la elegida en el perfil.
2. **Formatos** (en píxeles):
   - Post / carrusel Instagram: 1080×1350 (4:5). Story / reel / TikTok: 1080×1920 con zona segura (deja libres ~250 px arriba y ~350 px abajo). Portada de reel: diseña en 1080×1920 pero con lo importante dentro del recorte 1080×1350 del feed. Highlights: icono centrado en 1080×1920.
3. **Principios**: una idea por pieza, jerarquía clara (titular grande, apoyo, CTA), máximo 2 tipografías, contraste legible en móvil, la foto del estudio como protagonista, aire. En carruseles: la portada es el hook, una idea por slide, última slide con CTA (guardar / compartir / reservar), elemento visual que invite a deslizar.
4. **Producción**:
   - **Canva** conectado: busca plantillas de marca del usuario; si no, genera el diseño, revisa el resultado y ofrece exportar (PNG/PDF/MP4).
   - **Figma** conectado: carga antes la skill `figma:figma-use` y crea los frames.
   - Sin conectores: genera el diseño como HTML/SVG y expórtalo a PNG con el navegador (Playwright) al tamaño exacto, o entrega un brief detallado (textos, layout, colores, tipografía, fotos a usar) para montarlo en minutos.
5. **Revisión**: comprueba legibilidad en tamaño móvil, ortografía, zona segura y coherencia con el feed antes de entregar. Ofrece 2 variantes cuando sea una pieza importante.

Para logos o identidad completa puedes apoyarte en `anthropic-skills:logo-design`, `anthropic-skills:brandkit` o `anthropic-skills:poster-design` si están instaladas.
