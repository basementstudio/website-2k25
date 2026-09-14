// Remounts on every intra-machine navigation (unlike the layout, which
// persists), so the CRT flicker replays for each new page's content while the
// header above stays put. Server component — no pathname read needed.
const AiTemplate = ({ children }: { children: React.ReactNode }) => (
  <div className="machine-flicker flex min-w-0 flex-col gap-8">{children}</div>
)

export default AiTemplate
