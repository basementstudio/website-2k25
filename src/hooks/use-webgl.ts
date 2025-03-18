import { useEffect } from "react"

import { useState } from "react"
import { WebGL } from "three/examples/jsm/Addons.js"

export const useWebgl = () => {
  const [webglEnabled, setWebglEnabled] = useState(true)

  useEffect(() => {
    const webgl = WebGL.isWebGL2Available()
    setWebglEnabled(webgl)
  }, [])

  return webglEnabled
}
