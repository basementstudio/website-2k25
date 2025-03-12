import { useThree } from "@react-three/fiber"
import { useAnimationFrame } from "motion/react"
import type { ReactNode } from "react"
import { createContext, useContext } from "react"

// Contexto para compartir el tiempo de animación
interface AnimationContext {
  time: number
  delta: number
}

const AnimationContext = createContext<AnimationContext>({ time: 0, delta: 0 })

// Hook para acceder al tiempo de animación
export const useAnimationTime = () => useContext(AnimationContext)

interface AnimationControllerProps {
  children: ReactNode
}

/**
 * Componente que usa Motion para controlar el ciclo de animación global
 * y sincroniza React Three Fiber con él
 */
export function AnimationController({ children }: AnimationControllerProps) {
  // Obtenemos invalidate de React Three Fiber
  const { invalidate } = useThree()

  // Valores actuales de tiempo que se compartirán a través del contexto
  const timeValues = { time: 0, delta: 0 }

  // Usamos useAnimationFrame de Motion como nuestro único RAF
  useAnimationFrame((time, delta) => {
    // Actualizamos los valores de tiempo
    timeValues.time = time
    timeValues.delta = delta

    // Solicitamos a R3F que renderice un nuevo frame
    invalidate()

    // Aquí podrías también ejecutar otras actualizaciones globales
    // que dependan del tiempo de animación
  })

  return (
    <AnimationContext.Provider value={timeValues}>
      {children}
    </AnimationContext.Provider>
  )
}
