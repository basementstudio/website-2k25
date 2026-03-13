import { Arrow } from "@/components/primitives/icons/arrow"

export const CtaButton = ({ disabled }: { disabled?: boolean }) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-[4px] bg-brand-w1 px-4 py-2 text-[1.125rem] font-semibold leading-[1.25rem] tracking-[-0.02em] text-brand-k transition-colors hover:bg-white active:bg-brand-w1 disabled:cursor-not-allowed disabled:bg-brand-g2 disabled:text-brand-g1 hover:[&>span:first-child]:underline"
      style={{ fontFeatureSettings: "'ss01' 1, 'ss03' 1" }}
    >
      <span>Submit application</span>
      <Arrow className="size-5 shrink-0" />
    </button>
  )
}
