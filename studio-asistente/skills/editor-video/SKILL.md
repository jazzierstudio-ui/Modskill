---
name: editor-video
description: Edita vídeos para reels, TikTok y clientes — guion y estructura, plan de montaje, cortes, reencuadre a 9:16, subtítulos, música, color y exportación. Puede editar directamente con ffmpeg los archivos que el usuario suba o dar instrucciones paso a paso para CapCut, Premiere, DaVinci Resolve o Final Cut. Úsala para "edita este vídeo", "monta un reel", "subtítulos", "pásalo a vertical", "acelera", "guion para reel", "exporta para Instagram".
---

# Editor de vídeo

## 1. Antes de editar
- Objetivo de la pieza, red, duración meta (reel ideal 7-30 s para alcance, 30-90 s para tutoriales), audio (tendencia o propio), texto en pantalla y CTA.
- Si es para redes, escribe el **guion de montaje**: hook (0-2 s), desarrollo por planos con duración, momento del corte al ritmo del audio, texto en pantalla, cierre/CTA.

## 2. Edición directa (archivos en el entorno)
Comprueba que `ffmpeg` está disponible (`ffmpeg -version`); analiza con `ffprobe` (duración, resolución, fps, audio). Trabaja siempre sobre copias en una carpeta de salida y nunca sobrescribas el original. Operaciones habituales:

```bash
# Recortar un tramo
ffmpeg -ss 00:00:03 -to 00:00:12 -i in.mp4 -c:v libx264 -crf 18 -c:a aac out.mp4
# Reencuadrar horizontal a vertical 1080x1920 (centrado)
ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy vertical.mp4
# Unir clips (lista.txt con: file 'a.mp4')
ffmpeg -f concat -safe 0 -i lista.txt -c:v libx264 -crf 18 -c:a aac montaje.mp4
# Velocidad 2x
ffmpeg -i in.mp4 -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" -map "[v]" -map "[a]" rapido.mp4
# Poner música bajando el audio original
ffmpeg -i in.mp4 -i musica.mp3 -filter_complex "[0:a]volume=0.3[a0];[1:a]volume=0.8[a1];[a0][a1]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" -c:v copy -shortest con_musica.mp4
# Quemar subtítulos
ffmpeg -i in.mp4 -vf "subtitles=subs.srt:force_style='Fontsize=14,Alignment=2,MarginV=60'" subtitulado.mp4
# Exportar para Instagram/TikTok
ffmpeg -i in.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p -r 30 -b:v 8M -c:a aac -b:a 192k -movflags +faststart final.mp4
```
Para subtítulos: transcribe (si hay herramienta de transcripción disponible) o pide/escribe el texto, genera el `.srt` y cuida la zona segura (no tapar la parte inferior de la interfaz). Para limpiar silencios y muletillas puede usarse la skill `video-cleanup:video-cleanup` si está instalada.

Muestra un fotograma de control (`ffmpeg -ss 1 -i final.mp4 -frames:v 1 control.jpg`) y entrega el archivo final.

## 3. Instrucciones para su programa
Si el usuario edita él mismo, da los pasos exactos en su programa (del perfil): cortes al ritmo, keyframes de zoom, transiciones, plantilla de subtítulos, corrección de color (balance → exposición → contraste → look), ajustes de exportación (1080×1920, 30 fps, H.264, 8-12 Mbps).

## 4. Portada
Propón el fotograma de portada y el texto; para diseñarla pásalo a la skill disenador.
