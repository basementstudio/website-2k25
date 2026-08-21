import { createMcpHandler } from "mcp-handler"
import { z } from "zod"

import { COMPANY_FACTS } from "@/lib/company-facts"

import { fetchContentIndex } from "./content"
import { fetchMarkdownPage, isKnownMarkdownPath } from "./get-page"
import {
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  MCP_TOOL_SUMMARIES
} from "./manifest"

const toolDescription = (name: string) =>
  MCP_TOOL_SUMMARIES.find((tool) => tool.name === name)?.description

const text = (value: string) => ({
  content: [{ type: "text" as const, text: value }]
})

const errorText = (value: string) => ({
  content: [{ type: "text" as const, text: value }],
  isError: true
})

export const mcpRequestHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      "get_studio_info",
      {
        title: "Studio info",
        description: toolDescription("get_studio_info"),
        inputSchema: z.object({})
      },
      async () => text(JSON.stringify(COMPANY_FACTS, null, 2))
    )

    server.registerTool(
      "list_content",
      {
        title: "List content",
        description: toolDescription("list_content"),
        inputSchema: z.object({})
      },
      async () => {
        const entries = await fetchContentIndex()
        return text(JSON.stringify(entries, null, 2))
      }
    )

    server.registerTool(
      "get_page",
      {
        title: "Get page as markdown",
        description: toolDescription("get_page"),
        inputSchema: z.object({
          path: z
            .string()
            .describe(
              "Markdown mirror path, e.g. /services.md or /post/<slug>.md — see list_content"
            )
        })
      },
      async ({ path }) => {
        if (!isKnownMarkdownPath(path)) {
          return errorText(
            `Unknown path "${path}". Valid paths are the markdown mirrors listed by list_content (e.g. /services.md, /post/<slug>.md) plus /sitemap.md, /llms.txt, and /agents.md.`
          )
        }
        const page = await fetchMarkdownPage(path)
        if (!page.ok) {
          return errorText(`Fetching "${path}" failed with ${page.status}.`)
        }
        return text(page.text)
      }
    )

    server.registerTool(
      "search_content",
      {
        title: "Search content",
        description: toolDescription("search_content"),
        inputSchema: z.object({
          query: z.string().describe("Case-insensitive title search")
        })
      },
      async ({ query }) => {
        const entries = await fetchContentIndex()
        const needle = query.toLowerCase()
        const matches = entries.filter((entry) =>
          entry.title.toLowerCase().includes(needle)
        )
        if (matches.length === 0) {
          return text(
            `No titles match "${query}". Use list_content for the full index.`
          )
        }
        return text(JSON.stringify(matches, null, 2))
      }
    )
  },
  {
    serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    instructions:
      "Read-only access to basement.studio content. Start with list_content or search_content to find a page, then get_page to read it as markdown."
  }
)
