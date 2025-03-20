import { Footer } from "@/components/layout/footer"

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <main
      id="main-content"
      className="relative flex scroll-m-9 flex-col bg-brand-k pb-24 pt-4 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10"
    >
      {children}
    </main>
    <Footer />
  </>
)

export default Layout
