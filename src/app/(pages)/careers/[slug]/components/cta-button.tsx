import { Arrow } from "@/components/primitives/icons/arrow"

export const CtaButton = ({ disabled }: { disabled?: boolean }) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group flex items-center justify-center gap-2 rounded-sm bg-brand-w1 px-4 py-2 text-[1.125rem] font-semibold leading-[1.25rem] tracking-[-0.02em] text-brand-k transition-colors duration-200 active:bg-brand-w1 enabled:hover:bg-white disabled:cursor-not-allowed disabled:bg-brand-g2 disabled:text-brand-g1"
    >
      <span
        className={
          disabled ? undefined : "transition-all duration-200 group-hover:underline"
        }
      >
        Submit application
      </span>
      <Arrow className="size-5 shrink-0" />
    </button>
  )
}
