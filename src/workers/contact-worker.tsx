import { render } from "@react-three/offscreen"

import ContactScene from "@/components/contact/contact-scene"

self.onmessage = (
  e: MessageEvent<{ type: string; modelUrl: string; idleUrl: string }>
) => {
  const { type, modelUrl } = e.data
  if (type === "load-model") {
    render(<ContactScene modelUrl={modelUrl} />)
  }
}
