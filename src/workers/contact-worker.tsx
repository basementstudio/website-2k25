import { render } from "@react-three/offscreen"

import ContactScene from "@/components/contact/contact-scene"

console.log("OffscreenCanvas support:", typeof OffscreenCanvas !== "undefined")

render(<ContactScene />)
