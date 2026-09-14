"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useEffect, useMemo, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { PCFShadowMap } from "three"

import { useAssets } from "@/components/assets-provider"
import { createSiteEvents } from "@/lib/graphics/events"
import { createSiteRenderer } from "@/lib/graphics/renderer"
import { RendererLifetime } from "@/lib/graphics/renderer-lifetime"

import type { ContactEvent } from "./contact-controller"
import { ContactController } from "./contact-controller"
import { ContactScene } from "./contact-scene"
import { ContactScreen } from "./contact-screen"
import { useContactStore } from "./contact-store"

export const ContactCanvas = () => {
  const { contactPhone } = useAssets()
  const open = useContactStore((s) => s.isContactOpen)
  const animating = useContactStore((s) => s.isAnimating)
  const controller = useMemo(() => new ContactController(), [])
  const [failed, setFailed] = useState(false)
  const [recovering, setRecovering] = useState(false)
  useEffect(() => {
    useContactStore.getState().setController(controller)
    const receive = (event: ContactEvent) => {
      const { type } = event
      if (type === "outro-complete") {
        useContactStore.setState({
          isContactOpen: false,
          isAnimating: false,
          closingCompleted: true,
          introCompleted: false
        })
        document.dispatchEvent(new CustomEvent("contactClosed"))
      }
      if (type === "animation-starting")
        useContactStore.getState().setIsAnimating(true)
      if (
        [
          "animation-complete",
          "animation-rejected",
          "scale-animation-complete",
          "scale-down-animation-complete"
        ].includes(type)
      )
        useContactStore.getState().setIsAnimating(false)
      if (type === "scale-animation-complete")
        useContactStore.getState().setIntroCompleted(true)
      if (type === "scale-down-animation-complete")
        useContactStore.getState().setClosingCompleted(true)
    }
    const unsubscribe = controller.events.subscribe(receive)
    const resize = () =>
      controller.commands.emit({
        type: "window-resize",
        windowDimensions: { width: innerWidth, height: innerHeight }
      })
    window.addEventListener("resize", resize)
    return () => {
      unsubscribe()
      window.removeEventListener("resize", resize)
      useContactStore.getState().setController(null)
    }
  }, [controller])
  useEffect(() => {
    if (failed && open)
      useContactStore.setState({ isAnimating: false, introCompleted: true })
  }, [failed, open])
  const fail = () => {
    if (!recovering) setRecovering(true)
    else {
      setFailed(true)
      useContactStore.setState({ isAnimating: false, introCompleted: true })
    }
  }
  return (
    <>
      <ContactScreen fallback={failed} />
      {!failed && (
        <ErrorBoundary fallback={null} onError={fail} resetKeys={[recovering]}>
          <Canvas
            events={createSiteEvents}
            shadows={{ enabled: false, type: PCFShadowMap }}
            style={{ visibility: open || animating ? "visible" : "hidden" }}
            key={String(recovering)}
            frameloop={open || animating ? "always" : "never"}
            dpr={[1, 1.5]}
            camera={{ position: [0, 0.2, 2], fov: 8.5 }}
            gl={(options) =>
              createSiteRenderer(
                { canvas: options.canvas as HTMLCanvasElement, alpha: true },
                fail,
                recovering
              )
            }
          >
            <RendererLifetime />
            <Suspense fallback={null}>
              <ContactScene
                modelUrl={contactPhone}
                controller={controller}
                open={open}
              />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      )}
    </>
  )
}
