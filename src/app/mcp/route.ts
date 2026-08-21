// Alias: /.well-known/mcp is the audited/advertised path, but /mcp is the
// de-facto default MCP clients try first.
import { mcpRequestHandler, serveMcpCardOr405 } from "@/lib/mcp/handlers"

export const maxDuration = 30

export const GET = serveMcpCardOr405
export const POST = mcpRequestHandler
export const DELETE = mcpRequestHandler
