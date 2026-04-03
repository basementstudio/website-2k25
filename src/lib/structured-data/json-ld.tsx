interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

export const JsonLd = ({ data }: JsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
)
