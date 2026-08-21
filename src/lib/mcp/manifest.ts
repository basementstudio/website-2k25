import { COMPANY_FACTS } from "@/lib/company-facts"
import { SITE_URL } from "@/lib/constants"

export const MCP_SERVER_NAME = "basement-studio"
export const MCP_SERVER_VERSION = "1.0.0"

export const MCP_TOOL_SUMMARIES = [
  {
    name: "get_studio_info",
    description:
      "Canonical facts about basement.studio: services, notable clients, location, contact channels."
  },
  {
    name: "list_content",
    description:
      "Index of every page, blog post, showcase project, and open position, with markdown mirror URLs."
  },
  {
    name: "get_page",
    description:
      "Fetch any page of the site as markdown by its mirror path, e.g. /services.md or /post/<slug>.md."
  },
  {
    name: "search_content",
    description: "Search site content by title; returns matching markdown URLs."
  }
] as const

/**
 * Discovery "server card" served at /.well-known/mcp (GET) and
 * /.well-known/mcp.json. MCP discovery is still a draft (SEP-1649/SEP-1960),
 * so the card carries the fields both proposals agree on: identity, endpoint,
 * transport, auth, and the tool list.
 */
export const mcpServerCard = {
  name: MCP_SERVER_NAME,
  version: MCP_SERVER_VERSION,
  title: "basement.studio",
  description: `${COMPANY_FACTS.description} This MCP server exposes the studio's public content — pages, blog posts, showcase projects, and open positions — as read-only tools.`,
  endpoint: `${SITE_URL}/.well-known/mcp`,
  transport: ["streamable-http"],
  authentication: { type: "none" },
  capabilities: { tools: {} },
  tools: MCP_TOOL_SUMMARIES,
  website: SITE_URL,
  documentation: `${SITE_URL}/llms.txt`,
  contact: COMPANY_FACTS.contactEmail
}
