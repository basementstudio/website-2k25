import { AgentRecoveryLinks } from "@/components/agent-recovery-links"

import NotFoundClient from "./not-found.client"

export default function NotFound() {
  return (
    <>
      <AgentRecoveryLinks className="sr-only" />
      <NotFoundClient />
    </>
  )
}
