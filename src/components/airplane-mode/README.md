# Modo avión

Abrir una sección con la oficina 3D, esperar a que termine de cargar y pulsar **Modo avión** (abajo a la derecha). El botón se oculta durante inspecciones, contacto, transiciones y otros minijuegos. **Volver a la oficina** restaura la cámara de navegación; cambiar de ruta también cierra el vuelo.

- WASD / flechas: subir, bajar y girar. Espacio: impulso breve (el avión cae entre impulsos). Esc: salir del vuelo. R: reiniciar. C: alterna entre la GoPro montada en el avión (por defecto) y la cámara de seguimiento.
- Siete aros en orden, colisiones, cámara de seguimiento con corrección ante paredes, contador y controles táctiles.
- Vuelo libre: si pasan 5 s sin tocar nada, o la ventana pierde el foco (Alt+Tab), un piloto automático sigue el recorrido de `path.glb` (una línea cerrada dibujada en Blender, `airplane.path` en el manifest); cualquier tecla devuelve el control. Para cambiar el recorrido: re-exportar la línea, `pnpm assets:hash` y actualizar el manifest — el test de `physics.test.ts` simula vueltas completas y falla si el recorrido choca con el collider. En contrarreloj, perder el foco sigue pausando.
- El avión que vuela es un clon del `SM_Plane` de `officeItems` (el mismo del escritorio, que se oculta durante el vuelo). Despega desde donde está en el escritorio. Sus shape keys: `u`/`d` siguen subir/bajar, `N` es el temblor (más fuerte con la velocidad y al chocar). El material `papier` usa la mitad izquierda de la textura arriba y la derecha (U + 0.5) abajo.
- `Collider.glb` conserva su archivo original con nombre content-hashed en el manifest. `airplane.plane` (el `Plane.glb` viejo) quedó en el manifest pero ya no se usa.
- El collider usa sus triángulos y transformaciones de Blender, no la caja envolvente de toda la oficina. Sólo colisionan las superficies incluidas en ese GLB; el mobiliario ausente del collider sigue siendo decorativo.
- `physics.ts` contiene el recorrido y el radio de colisión. `flight.tsx` contiene la velocidad y la cámara.

Se reutiliza el Canvas, el Map, las luces horneadas y el Renderer del sitio. La cámara de navegación se desmonta durante el vuelo y se restaura al salir. Los modelos del vuelo se cargan sólo al entrar; no se modifica la configuración de Sanity.

Validación: `node_modules/.bin/tsx --test src/components/airplane-mode/physics.test.ts`, `node_modules/.bin/tsc --noEmit --incremental false`, ESLint de los archivos modificados y `node_modules/.bin/tsx scripts/3d-assets/verify.ts`.
