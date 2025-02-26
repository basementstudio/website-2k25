import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { forwardRef, useMemo, useRef, useState } from "react"
import {
  Color,
  Euler,
  Line,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  Quaternion,
  ShaderMaterial,
  SpotLight as SpotLightType,
  Vector3,
  type Group
} from "three"
import { useControls } from "leva"
import { COLORS } from "../lib/colors"
import { useGame } from "../lib/use-game"
import { mergeRefs } from "react-merge-refs"
import { OnIntersectCallback, Sensor, SensorInterface } from "../sensors"
import { GLTF } from "three/examples/jsm/Addons.js"

interface MotoNodes extends GLTF {
  nodes: {
    SM_Glow_Line: Line
    SM_Light_Back: Mesh
    SM_Light_Circle: Mesh
    SM_Light_Front: Mesh
    SM_Racer: Mesh
    Scene: Group
  }
}

export interface MotorcycleProps {
  onIntersectionEnter?: OnIntersectCallback
  color?: Color
}

export const Motorcycle = forwardRef<Group, MotorcycleProps>(
  ({ color = COLORS.blueLight, onIntersectionEnter, ...props }, ref) => {
    useControls(() => ({
      showHitboxes: {
        value: false,
        onChange: (value: boolean) => {
          useGame.setState({ showHitBoxes: value })
        }
      }
    }))

    const { nodes } = useGLTF("/models/moto.glb") as unknown as MotoNodes
    const light = useMemo(() => new SpotLightType("white", 20, 30, 0.5), [])
    light.decay = 0.1

    const showHitBoxes = useGame((s) => s.showHitBoxes)
    const groupRef = useRef<Object3D | null>(null)

    const materials = useMemo(
      () => ({
        outerBodyMaterial: new MeshBasicMaterial({ color: COLORS.black }),
        lightsMeshMaterial: new MeshPhysicalMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 10
        }),
        lightsLineMaterial: new ShaderMaterial({
          uniforms: {
            color: { value: color },
            emissive: { value: color },
            emissiveIntensity: { value: 1 }
          },
          vertexShader: /*glsl*/ `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
          fragmentShader: /*glsl*/ `
          uniform vec3 color;
          uniform vec3 emissive;
          uniform float emissiveIntensity;
          varying vec3 vNormal;
          varying vec3 vPosition;
      
          void main() {
            vec3 emissiveColor = emissive * emissiveIntensity;
            gl_FragColor = vec4(color + emissiveColor, 1.0);
          }
        `
        })
      }),
      [color]
    )

    useControls(() => ({
      lineColor: {
        value: `#${COLORS.blueLight.getHexString()}`,
        onChange: (value: string) => {
          COLORS.blueLight.set(value)
        }
      }
    }))

    const scene = useMemo(() => {
      const copy = nodes.Scene.clone(true)

      const SM_Light_Back = copy.getObjectByName("SM_Light_Back") as Mesh
      const SM_Light_Front = copy.getObjectByName("SM_Light_Front") as Mesh
      const SM_Light_Circle = copy.getObjectByName("SM_Light_Circle") as Mesh
      const SM_Glow_Line = copy.getObjectByName("SM_Glow_Line") as Line
      const SM_Racer = copy.getObjectByName("SM_Racer") as Mesh

      SM_Light_Back.material = materials.lightsMeshMaterial
      SM_Light_Front.material = materials.lightsMeshMaterial
      SM_Light_Circle.material = materials.lightsMeshMaterial
      SM_Glow_Line.material = materials.lightsLineMaterial
      SM_Racer.material = materials.outerBodyMaterial

      return copy
    }, [nodes, materials])

    const {
      position,
      direction,
      colliderPos,
      startedRef,
      quaterion,
      rotation
    } = useMemo(
      () => ({
        startedRef: { current: false },
        position: new Vector3(),
        direction: new Vector3(),
        quaterion: new Quaternion(),
        rotation: new Euler(),
        colliderPos: new Vector3()
      }),
      []
    )

    const sensorRef = useRef<SensorInterface | null>(null)

    // I dont wan't the sensor to be active untily its position is correct
    const [startedSensor, setStartedSensor] = useState(false)

    useFrame(() => {
      if (!light) return
      // calculate direction using vehicle position
      scene.getWorldPosition(position)
      scene.getWorldDirection(direction)
      //update rotation
      scene.getWorldQuaternion(quaterion)
      rotation.setFromQuaternion(quaterion)

      colliderPos.copy(position)
      colliderPos.y += motoColliderScale[1]

      light.position.y = 1
      light.position.z = -6

      light.target.position.copy(direction)

      if (!startedRef.current) {
        setStartedSensor(true)
        startedRef.current = true
      }
    })

    return (
      <>
        <Sensor
          ref={sensorRef}
          position={colliderPos}
          halfSize={motoColliderScale}
          active={startedSensor}
          rotation={rotation}
          debug={showHitBoxes}
          onIntersect={onIntersectionEnter}
        />
        <group ref={mergeRefs([ref, groupRef])} {...props}>
          <primitive object={light}>
            <primitive object={light.target} />
          </primitive>
          <group position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
            <primitive object={scene} />
          </group>
        </group>
      </>
    )
  }
)

const motoColliderScale = [1.5, 3.5, 9].map((s) => s / 2) as [
  number,
  number,
  number
]

Motorcycle.displayName = "Motorcycle"
