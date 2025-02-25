#include <common>
#include <uv_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>

#ifdef USE_MULTI_MAP
attribute float mapIndex;
varying float vMapIndex;
#endif

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    #include <uv_vertex>
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>

    vUv = uv;
    vNormal = normal;
    vPosition = position;

    #ifdef USE_MULTI_MAP
    vMapIndex = mapIndex;
    #endif
}
