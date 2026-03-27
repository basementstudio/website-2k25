import { Arrow } from "@/components/primitives/icons/arrow"

export const CtaButton = ({ disabled }: { disabled?: boolean }) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`group flex items-center justify-center gap-2 rounded-sm bg-brand-w1 px-4 py-2 text-[1.125rem] font-semibold leading-[1.25rem] tracking-[-0.02em] text-brand-k active:bg-brand-w1 disabled:cursor-not-allowed disabled:bg-brand-g2 disabled:text-brand-g1${disabled ? "" : " actionable-opacity [--anim-duration:250ms]"}`}
    >
      <span
        className={
          disabled ? undefined : "group-hover:underline"
        }
      >
        Submit application
      </span>
      <Arrow className="size-5 shrink-0" />
    </button>
  )
}
