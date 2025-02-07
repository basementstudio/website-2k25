import { Grid } from "@/components/grid"
import { Footer } from "@/components/layout/footer"

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <main className="relative flex flex-col bg-brand-k pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
      {children}
      <Grid />
    </main>
    <Footer />
  </>
)

export default Layout
