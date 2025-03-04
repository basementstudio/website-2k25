import { useFrame } from "@react-three/fiber"
import { forwardRef, useEffect, useMemo, useRef } from "react"
import {
  AnimationClip,
  Group,
  Material,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  SkinnedMesh,
  Vector3
} from "three"
import { create } from "zustand"

import {
  InstancedBatchedSkinnedMesh,
  InstancedUniformParams
} from "./instanced-skinned-mesh"

type GroupProps = React.ComponentProps<"group">

interface InstancesProviderProps {
  mesh: SkinnedMesh | SkinnedMesh[]
  material?: Material
  count: number
  animations?: AnimationClip[]
  instancedUniforms?: InstancedUniformParams[]
}

interface InstancedMeshStore {
  instancedMesh: InstancedBatchedSkinnedMesh | null
}

export interface InstanceUniform {
  value: number | number[]
}

export interface InstancePositionProps<T extends string> {
  animationId?: number
  animationName?: string
  timeSpeed?: number
  initialTime?: number
  geometryName?: T
  geometryId?: number
  uniforms?: Record<string, InstanceUniform>
  activeMorphName?: string
}

export const createInstancedSkinnedMesh = <T extends string>() => {
  /** Create a store to connect instances with positioning */
  const useInstancedMesh = create<InstancedMeshStore>(() => ({
    instancedMesh: null,
    geometryId: null
  }))

  /** Create the instanced mesh that will be rendered */
  function InstancedMesh({
    mesh,
    count,
    animations,
    material: propMaterial,
    instancedUniforms
  }: InstancesProviderProps) {
    // prevent re-render
    const refs = useRef({ mesh, animations })

    useEffect(() => {
      const { mesh, animations } = refs.current
      let maxPos = 0
      let maxIdx = 0
      let material = propMaterial ?? new MeshStandardMaterial()

      if (Array.isArray(mesh)) {
        maxPos = mesh.reduce(
          (acc, m) => acc + m.geometry.attributes.position.count,
          0
        )
        maxIdx = mesh.reduce(
          (acc, m) => acc + (m.geometry.index?.count || 0),
          0
        )
        if (!propMaterial) {
          for (const m of mesh) {
            if (m.material) {
              material = m.material as MeshStandardMaterial
            }
          }
        }
      } else {
        // Not array
        maxPos = mesh.geometry.attributes.position.count
        maxIdx = mesh.geometry.index?.count || 0
        if (!propMaterial) {
          material = mesh.material as MeshStandardMaterial
        }
      }

      const instancer = new InstancedBatchedSkinnedMesh({
        maxInstanceCount: count,
        maxVertexCount: maxPos,
        maxIndexCount: maxIdx,
        material,
        instancedUniforms
      })

      instancer.frustumCulled = false

      if (Array.isArray(mesh)) {
        mesh.forEach((m) => {
          const id = instancer.addGeometry(m.geometry)
          if (m.morphTargetDictionary) {
            instancer.addMorphGeometry(id, m.morphTargetDictionary)
          }
        })
      } else {
        const id = instancer.addGeometry(mesh.geometry)
        if (mesh.morphTargetDictionary) {
          instancer.addMorphGeometry(id, mesh.morphTargetDictionary)
        }
      }

      if (animations) {
        animations.forEach((animation) => {
          const skeleton = Array.isArray(mesh)
            ? mesh[0].skeleton
            : mesh.skeleton
          instancer.addAnimation(skeleton, animation)
        })
      }

      useInstancedMesh.setState({
        instancedMesh: instancer
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refs, count, propMaterial])

    const instancedMesh = useInstancedMesh((state) => state.instancedMesh)

    useFrame((_, delta) => {
      if (!instancedMesh) return

      // play animations
      instancedMesh.update(delta)
    })

    if (!instancedMesh) return null

    return <primitive object={instancedMesh} />
  }

  /** Create the component that will position the instances */
  const InstancePosition = forwardRef<
    Group,
    GroupProps & InstancePositionProps<T>
  >(function InstancePosition(
    {
      animationId,
      animationName,
      timeSpeed,
      initialTime,
      geometryName,
      geometryId,
      uniforms,
      activeMorphName,
      ...props
    },
    ref
  ) {
    const instancedMesh = useInstancedMesh((state) => state.instancedMesh)

    const instanceId = useRef<number | null>(null)

    const { group, groupPosition, groupRotation, positionMatrix, groupScale } =
      useMemo(
        () => ({
          group: new Group(),
          groupPosition: new Vector3(),
          groupRotation: new Quaternion(),
          groupScale: new Vector3(),
          positionMatrix: new Matrix4()
        }),
        []
      )

    // attach instance to the mesh
    useEffect(() => {
      if (!instancedMesh) return

      const resolvedGeometryId =
        typeof geometryId === "number"
          ? geometryId
          : instancedMesh.getGeometryId(geometryName as any) || 0

      let selectedAnimationId = 0

      if (animationId !== undefined) {
        selectedAnimationId = animationId
      } else if (animationName !== undefined) {
        selectedAnimationId = instancedMesh.clips.findIndex(
          (clip) => clip.name === animationName
        )
      }

      // Add instance to the instanced mesh
      instanceId.current = instancedMesh.createInstance(resolvedGeometryId, {
        timeSpeed: timeSpeed ?? 1, // forward
        time: initialTime ?? 0, // start time
        animationId: selectedAnimationId
      })

      return () => {
        if (instanceId.current === null) return
        instancedMesh.deleteInstance(instanceId.current)
        instanceId.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instancedMesh, geometryName])

    // react to animation change
    useEffect(() => {
      if (!instancedMesh) return
      if (instanceId.current === null) return

      let selectedAnimationId = 0

      if (animationId !== undefined) {
        selectedAnimationId = animationId
      } else if (animationName !== undefined) {
        selectedAnimationId = instancedMesh.clips.findIndex(
          (clip) => clip.name === animationName
        )
      }

      instancedMesh.setInstanceData(instanceId.current, {
        time: initialTime ?? 0,
        animationId: selectedAnimationId
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instancedMesh, animationId, animationName])

    // react to time speed change
    useEffect(() => {
      if (!instancedMesh) return
      if (instanceId.current === null) return

      instancedMesh.setInstanceData(instanceId.current, {
        timeSpeed: timeSpeed ?? 1
      })
    }, [instancedMesh, timeSpeed])

    useEffect(() => {
      if (!instancedMesh) return
      const id = instanceId.current
      if (id === null) return

      if (uniforms) {
        Object.entries(uniforms).forEach(([name, value]) => {
          instancedMesh.setInstanceUniform(id, name, value.value)
        })
      }
    }, [instancedMesh, uniforms])

    useFrame(() => {
      // update instance position
      if (instanceId.current === null) return
      if (!instancedMesh) return
      // apply mesh scale
      group.getWorldScale(groupScale)
      // apply mesh rotation
      group.getWorldQuaternion(groupRotation)
      positionMatrix.makeRotationFromQuaternion(groupRotation)
      // apply mesh position
      group.getWorldPosition(groupPosition)
      positionMatrix.setPosition(
        groupPosition.x,
        groupPosition.y,
        groupPosition.z
      )
      positionMatrix.scale(groupScale)
      // apply positionMatrix to the instance
      instancedMesh.setMatrixAt(instanceId.current, positionMatrix)
    })

    useEffect(() => {
      if (!instancedMesh) return
      if (instanceId.current === null) return
      if (activeMorphName === undefined) return

      const resolvedGeometryId =
        typeof geometryId === "number"
          ? geometryId
          : instancedMesh.getGeometryId(geometryName as any) || 0

      instancedMesh.setInstanceMorph(
        instanceId.current,
        resolvedGeometryId,
        activeMorphName
      )
    }, [instancedMesh, activeMorphName, geometryId, geometryName])

    return <primitive object={group} ref={ref} {...props} />
  })

  return { InstancedMesh, InstancePosition, useInstancedMesh }
}
