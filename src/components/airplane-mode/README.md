# Modo avión

Abrir una sección con la oficina 3D, esperar a que termine de cargar y pulsar **Modo avión** (abajo a la derecha). El botón se oculta durante inspecciones, contacto, transiciones y otros minijuegos. **Volver a la oficina** restaura la cámara de navegación; cambiar de ruta también cierra el vuelo.

- WASD / flechas: subir, bajar y girar. Espacio: impulso breve (el avión cae entre impulsos). Esc: pausa/continuar. R: reiniciar.
- Siete aros en orden, colisiones, cámara de seguimiento con corrección ante paredes, contador y controles táctiles.
- El vuelo se pausa cuando la pestaña o ventana pierde foco.
- `Plane.glb` y `Collider.glb` conservan sus archivos originales con nombres content-hashed en el manifest. El punto de partida se obtiene de la posición exportada del avión.
- El collider usa sus triángulos y transformaciones de Blender, no la caja envolvente de toda la oficina. Sólo colisionan las superficies incluidas en ese GLB; el mobiliario ausente del collider sigue siendo decorativo.
- `physics.ts` contiene el recorrido y el radio de colisión. `flight.tsx` contiene la velocidad y la cámara.

Se reutiliza el Canvas, el Map, las luces horneadas y el Renderer del sitio. La cámara de navegación se desmonta durante el vuelo y se restaura al salir. Los modelos del vuelo se cargan sólo al entrar; no se modifica la configuración de Sanity.

Validación: `node_modules/.bin/tsx --test src/components/airplane-mode/physics.test.ts`, `node_modules/.bin/tsc --noEmit --incremental false`, ESLint de los archivos modificados y `node_modules/.bin/tsx scripts/3d-assets/verify.ts`.
