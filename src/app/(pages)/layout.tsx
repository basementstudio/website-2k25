import { Footer } from "@/components/layout/footer"
import { ScrollDown } from "@/components/primitives/scroll-down"

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <main className="relative flex scroll-m-9 flex-col bg-brand-k pb-12 pt-4 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10 lg:pb-24">
      <ScrollDown />
      {children}
    </main>
    <Footer />
  </>
)

export default Layout
