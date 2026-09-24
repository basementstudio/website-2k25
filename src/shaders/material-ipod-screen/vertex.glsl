#include <common>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>

varying vec2 vUv;

void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  #include <logdepthbuf_vertex>

  vUv = uv;
}
