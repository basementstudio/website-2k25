import { SITE_URL } from "@/lib/constants"

export default function NotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>404</h1>
      <p>Not Found</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>
          <a href={SITE_URL}>Home</a>
        </li>
        <li>
          <a href={`${SITE_URL}/sitemap.md`}>Content index (markdown)</a>
        </li>
        <li>
          <a href={`${SITE_URL}/llms.txt`}>llms.txt</a>
        </li>
        <li>
          <a href={`${SITE_URL}/ai`}>Machine view</a>
        </li>
      </ul>
    </div>
  )
}
