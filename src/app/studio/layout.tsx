import { preloadModule } from "react-dom"

const bridgeScript = "https://core.sanity-cdn.com/bridge.js"

export default function StudioLayout({
  children
}: {
  children: React.ReactNode
}) {
  preloadModule(bridgeScript, { as: "script" })
  return (
    <>
      <script src={bridgeScript} async type="module" />
      {children}
    </>
  )
}
