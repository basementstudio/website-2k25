import { Navbar } from "@/components/layout/navbar"
import { Transitions } from "@/components/transitions"

const ContactLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <Transitions />
    <main className="layout-container relative flex h-[100svh] flex-col bg-brand-k after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
      {children}
    </main>
  </>
)

export default ContactLayout
