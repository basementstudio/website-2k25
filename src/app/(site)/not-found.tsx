import { AgentRecoveryLinks } from "@/components/agent-recovery-links"

import NotFoundClient from "./not-found.client"

// Server boundary: the visual 404 only exists after hydration flips the WebGL
// scene, so the sr-only block is the entire body a non-JS agent receives.
export default function NotFound() {
  return (
    <>
      <AgentRecoveryLinks className="sr-only" />
      <NotFoundClient />
    </>
  )
}
