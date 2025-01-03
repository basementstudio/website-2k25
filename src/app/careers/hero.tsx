import { cn } from "@/utils/cn"

export const Hero = ({ className }: { className?: string }) => {
  return (
    <section
      className={cn("grid-layout -mb-11 h-screen text-brand-w2", className)}
    >
      <h1 className="col-start-1 col-end-5 text-heading uppercase">Careers</h1>
      <p className="col-start-5 col-end-9 text-subheading">
        We’re all about growth, creativity, and shared success. We know that
        building something great starts with a team that feels valued and
        supported. That’s why we prioritize fostering an environment where every
        member feels driven to reach new heights.
      </p>
      <p className="col-start-9 col-end-13 text-subheading">
        Loyalty is a cornerstone of who we are—we invest in our people because
        their growth fuels our collective ambition. Together, we’re not just a
        team; we’re a thriving community of innovators.
      </p>
    </section>
  )
}
