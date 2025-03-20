import { Line } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { button, useControls } from "leva"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

export const CurveVisualization = () => {
  const { camera } = useThree()
  const [isAnimating, setIsAnimating] = useState(false)
  const progressRef = useRef(0)
  const speedRef = useRef(0.001)
  const lookAheadRef = useRef(0.1)

  const FINAL_LOOK_TARGET = new THREE.Vector3(3.46, 5.23, -27.66)
  const hasPassedTransitionPointRef = useRef(false)
  const lookTargetLerpProgressRef = useRef(0)

  const transitionPointRef = useRef(0.7)
  const transitionSpeedRef = useRef(0.05)

  const POINTS = [
    new THREE.Vector3(6.26, 1.16, -7.57),
    new THREE.Vector3(4.26, 5.2, -14),
    new THREE.Vector3(2.41, 5.29, -28.77)
  ]

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(POINTS, false, "catmullrom", 0.5)
  }, [])

  const curvePoints = useMemo(() => {
    return curve.getPoints(100)
  }, [curve])

  const indicatorRef = useRef<THREE.Mesh>(null)
  const transitionMarkerRef = useRef<THREE.Mesh>(null)
  const targetPointRef = useRef<THREE.Mesh>(null)

  useControls("curve animation", {
    animateCamera: {
      value: false,
      onChange: (v) => {
        setIsAnimating(v)
        if (!v) {
          hasPassedTransitionPointRef.current = false
          lookTargetLerpProgressRef.current = 0
        }
      }
    },
    speed: {
      value: 0.001,
      min: 0.0001,
      max: 0.005,
      step: 0.0001,
      onChange: (v) => {
        speedRef.current = v
      }
    },
    lookAhead: {
      value: 0.1,
      min: 0.01,
      max: 0.3,
      step: 0.01,
      onChange: (v) => {
        lookAheadRef.current = v
      }
    },
    transitionPoint: {
      value: 0.7,
      min: 0.1,
      max: 0.9,
      step: 0.05,
      onChange: (v) => {
        transitionPointRef.current = v
      }
    },
    transitionSpeed: {
      value: 0.05,
      min: 0.01,
      max: 0.2,
      step: 0.01,
      onChange: (v) => {
        transitionSpeedRef.current = v
      }
    },
    resetPosition: button(() => {
      progressRef.current = 0
      hasPassedTransitionPointRef.current = false
      lookTargetLerpProgressRef.current = 0

      if (camera) {
        const startPoint = curve.getPointAt(0)
        camera.position.copy(startPoint)
      }
    })
  })

  useFrame((_, delta) => {
    if (!isAnimating || !camera) return

    progressRef.current += speedRef.current
    if (progressRef.current > 1) progressRef.current = 0

    const currentPos = curve.getPointAt(progressRef.current)
    if (transitionMarkerRef.current) {
      transitionMarkerRef.current.position.copy(
        curve.getPointAt(transitionPointRef.current)
      )
    }

    if (targetPointRef.current) {
      targetPointRef.current.position.copy(FINAL_LOOK_TARGET)
    }

    if (
      progressRef.current >= transitionPointRef.current &&
      !hasPassedTransitionPointRef.current
    ) {
      hasPassedTransitionPointRef.current = true
    }

    let lookAtPos: THREE.Vector3

    if (hasPassedTransitionPointRef.current) {
      lookTargetLerpProgressRef.current = Math.min(
        lookTargetLerpProgressRef.current + transitionSpeedRef.current * delta,
        1
      )

      const curvePoint = curve.getPointAt(
        Math.min(progressRef.current + lookAheadRef.current, 1)
      )

      lookAtPos = curvePoint
        .clone()
        .lerp(FINAL_LOOK_TARGET, lookTargetLerpProgressRef.current)
    } else {
      lookAtPos = curve.getPointAt(
        Math.min(progressRef.current + lookAheadRef.current, 1)
      )
    }

    camera.position.copy(currentPos)
    camera.lookAt(lookAtPos)

    if (indicatorRef.current) {
      indicatorRef.current.position.copy(currentPos)
    }
  })

  useEffect(() => {
    if (isAnimating && camera) {
      hasPassedTransitionPointRef.current = false
      lookTargetLerpProgressRef.current = 0

      const startPoint = curve.getPointAt(0)
      camera.position.copy(startPoint)

      const lookPoint = curve.getPointAt(lookAheadRef.current)
      camera.lookAt(lookPoint)
    }
  }, [isAnimating, camera, curve])

  return (
    <>
      <Line points={curvePoints} color="#ffff00" lineWidth={3} dashed={false} />

      {POINTS.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      ))}

      {isAnimating && (
        <mesh ref={indicatorRef}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      )}

      <mesh ref={transitionMarkerRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#0000ff" />
      </mesh>

      <mesh ref={targetPointRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
    </>
  )
}
