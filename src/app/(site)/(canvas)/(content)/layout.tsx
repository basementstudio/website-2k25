import { PageShell } from "@/components/layout/page-shell"

export default function ContentLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <PageShell>{children}</PageShell>
}
