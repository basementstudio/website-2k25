import { useMesh } from "@/hooks/use-mesh"
import { OnIntersectCallback, Sensor, SensorInterface } from "../../sensors"
import { forwardRef, useMemo, useRef, useState, useEffect } from "react"
import { Color, Euler, Object3D, Quaternion, Vector3, type Group } from "three"
import { useFrame } from "@react-three/fiber"
import { useConnector } from "../../lib/connector"
import { mergeRefs } from "react-merge-refs"
import { useGame } from "../../lib/use-game"
import { useControls } from "leva"

export interface CarProps {
  onIntersectionEnter?: OnIntersectCallback
  position?: [number, number, number]
}

export const Car = forwardRef<Group, CarProps>(
  ({ onIntersectionEnter, ...props }, ref) => {
    useControls(() => ({
      showHitboxes: {
        value: false,
        onChange: (value: boolean) => {
          useGame.setState({ showHitBoxes: value })
        }
      }
    }))

    const showHitBoxes = useGame((s) => s.showHitBoxes)
    const groupRef = useRef<Object3D | null>(null)

    const { outdoorCarsMeshes: cars } = useMesh()

    const randomCar = useMemo(() => {
      return cars[Math.floor(Math.random() * cars.length)]!.clone()
    }, [cars])

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
    const [startedSensor, setStartedSensor] = useState(false)

    // Cleanup sensor on unmount
    useEffect(() => {
      return () => {
        if (sensorRef.current) {
          // Reset sensor state
          sensorRef.current.active = false
          startedRef.current = false
          setStartedSensor(false)
        }
      }
    }, [])

    useEffect(() => {
      const handleRestart = () => {
        if (sensorRef.current) {
          sensorRef.current.active = true
          startedRef.current = true
          setStartedSensor(true)
        }
      }

      useConnector.getState().subscribable.restart.addCallback(handleRestart)
      return () => {
        useConnector
          .getState()
          .subscribable.restart.removeCallback(handleRestart)
      }
    }, [])

    useFrame(() => {
      // calculate direction using vehicle position
      randomCar.getWorldPosition(position)
      randomCar.getWorldDirection(direction)
      //update rotation
      randomCar.getWorldQuaternion(quaterion)
      rotation.setFromQuaternion(quaterion)

      colliderPos.copy(position)
      colliderPos.y += motoColliderScale[1]

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
          <group position={[0, 0, 0]} rotation={[0, Math.PI * -0.5, 0]}>
            <primitive object={randomCar} />
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
