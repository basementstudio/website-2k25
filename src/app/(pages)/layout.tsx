import { Grid } from "@/components/grid"
import { Footer } from "@/components/layout/footer"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <main className="relative -mt-5 flex flex-col bg-brand-k pb-36 pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
        {children}
        <Grid />
      </main>
      <Footer />
    </>
  )
}

export default Layout
