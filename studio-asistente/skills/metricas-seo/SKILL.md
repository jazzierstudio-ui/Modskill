---
name: metricas-seo
description: Revisa las métricas de Instagram, TikTok y la web del estudio y controla su SEO — qué contenido funciona con la comunidad y cuál no, evolución frente a semanas anteriores, auditoría SEO de la web y del perfil de Google Business, palabras clave locales y acciones concretas. Úsala para "métricas", "estadísticas", "qué funciona", "informe del mes", "SEO", "posicionamiento", "por qué no crezco", "Google Business".
---

# Métricas y SEO

## A. Métricas de redes
1. **Datos**: pide capturas o exports de Instagram (Estadísticas profesionales / Meta Business Suite) y TikTok (Analytics o export de TikTok Studio), o usa un conector si está disponible. Nunca inventes cifras; si faltan datos, dilo.
2. **Por publicación** registra: fecha, formato, tema, hook, duración, alcance, reproducciones, % retención/vista completa, guardados, compartidos, comentarios, visitas al perfil, seguidores ganados, clics en web.
3. **Analiza**:
   - Tasa de interacción = (likes + comentarios + guardados + compartidos) / alcance.
   - Señales más valiosas: compartidos y guardados > comentarios > likes. Para reels: retención a los 3 s y vista completa.
   - Agrupa por formato, tema, hook, hora y día: qué grupo rinde por encima / por debajo de la media.
   - Compara con la revisión anterior en `~/.studio-asistente/metricas/`.
   Para cálculos con muchos datos, usa un script (Python/Node) en vez de hacerlos a mano.
4. **Entrega**: top 3 y peor 3 publicaciones con el porqué, 3 aprendizajes ("los tutoriales de luz se guardan 3× más que…"), qué repetir, qué dejar, y qué probar la semana que viene (un experimento con hipótesis). Si hay muchos datos, ofrece un gráfico o una página de dashboard.
5. **Guarda** el informe en `metricas/AAAA-MM-DD.md` y actualiza `aprendizajes.md`.

## B. SEO de la web
1. Analiza la web del perfil (WebFetch / navegador): títulos y meta descriptions, H1/H2, palabras clave locales ("fotógrafo de bodas en [ciudad]"), textos alternativos de imágenes, peso y formato de las imágenes (WebP/AVIF), velocidad y Core Web Vitals (PageSpeed), móvil, enlaces rotos, schema LocalBusiness, sitemap/robots, blog.
2. **Google Business Profile**: categorías, fotos recientes, reseñas y respuestas, horario, publicaciones.
3. Busca las palabras clave del nicho en la ciudad y mira quién posiciona y por qué.
4. Entrega una lista priorizada (impacto/esfuerzo) de 5-10 acciones, con los textos ya escritos (títulos, metas, alt, una idea de entrada de blog al mes ligada a las sesiones).

Puedes apoyarte en las skills `marketing:seo-audit` y `small-business:seo-ai-visibility` si están instaladas.
