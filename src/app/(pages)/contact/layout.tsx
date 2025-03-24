import { Navbar } from "@/components/layout/navbar"

const ContactLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <main className="relative flex flex-col bg-brand-k pb-24 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
      {children}
    </main>
  </>
)

export default ContactLayout
