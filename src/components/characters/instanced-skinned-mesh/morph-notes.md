# Morph targets notes

The following notes will help to implement morph targets to the InstancedBatchedSkinnedMesh.

General structure of a mesh with morph targets:

```jsonc
{
  "geometry": {
    "uuid": "idOfGeometry",
    "type": "BufferGeometry",
    "data": {
      "attributes": {
        // Geometry positions (BufferAttribute)
        "position": {
          "itemSize": 3,
          "type": "Float32Array",
          "array": [1, 2, 3]
        },
        // Geometry normals (BufferAttribute)
        "normal": {
          "itemSize": 3,
          "type": "Float32Array",
          "array": [1, 2, 3]
        }
      },
      // Geometry indices (BufferAttribute)
      "index": {
        "itemSize": 1,
        "type": "Uint32Array",
        "array": [1, 2, 3]
      },
      "morphAttributes": {
        // Morph targets for positions (BufferAttribute[])
        "position": [
          {
            "itemSize": 3,
            "type": "Float32Array",
            "array": [1, 2, 3]
          },
          {
            "itemSize": 3,
            "type": "Float32Array",
            "array": [1, 2, 3]
          }
        ],
        // Morph targets for normals (BufferAttribute[])
        "normal": [
          {
            "itemSize": 3,
            "type": "Float32Array",
            "array": [1, 2, 3]
          },
          {
            "itemSize": 3,
            "type": "Float32Array",
            "array": [1, 2, 3]
          }
        ],
        "morphTargetsRelative": true
      }
    }
  },
  // Morph target names to indices
  "morphTargetDictionary": {
    "morphTarget1Name": 0,
    "morphTarget2Name": 1
  },
  // Indicates active morph target
  "morphTargetInfluences": [0, 1]
}
```

## Storing data

Since our class can hold multiple geometries, we need to store all morph target data.

### Morph texture

These textures will have all morph information.

Let supose the following scenario

- Geometry A:
  - 4 Vertices
  - 2 Position Morph
- Geometry B:
  - 3 Vertices
  - 1 Position Morph

The texture will contain information as follows:

`[...GeometryA-morph1, ...GeometryA-morph-2, ...GeometryB-morph-1]`

Since geometry A has 2 morphs of 4 vertices and geometry B has 1 morph of 3 vertices, the texture will need 11 pixels to store infomration. `(4 * 2 + 3 * 1)`

Possible implementation:

```ts
export class InstancedBatchedSkinnedMesh extends THREE.BatchedMesh {
  private morphTexture: THREE.DataTexture | null = null

  private computeMorphTexture() {
    const componentSize = 3 //xyz

    // number of pixels needed to store all morph targets
    let offset = 0

    for (let i = 0; i < this.geometries.length; i++) {
      const geometry = this.geometries[i]
      const morphTargets = geometry.morphAttributes.position

      for (let j = 0; j < morphTargets.length; j++) {
        const morphTarget = morphTargets[j]
        offset += morphTarget.length / componentSize
      }
    }

    let size = Math.sqrt(offset)
    size = Math.ceil(size)

    const morphData = new Float32Array(size * size * componentSize)

    this.morphTexture = new THREE.DataTexture(
      morphData,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )

    this.morphTexture.needsUpdate = true

    // Fill the texture with the morph data
    for (let i = 0; i < this.geometries.length; i++) {
      const geometry = this.geometries[i]
      const morphTargets = geometry.morphAttributes.position

      for (let j = 0; j < morphTargets.length; j++) {
        const morphTarget = morphTargets[j]
      }
    }
  }
}
```

## Sampling morph targets

The default implementation of morph targets works as follows:

```glsl
export default /* glsl */`
#ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	transformed *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`;
```

It basically loops over each possible morph targets and adds it's transformation based on influence.
