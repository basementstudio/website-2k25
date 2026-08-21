import { SITE_URL } from "@/lib/constants"

// Untyped on purpose: openapi-types' V3_1 definitions reject valid 3.1
// documents (V3/V3_1 intersection bug).
const MARKDOWN_RESPONSE = {
  description: "Markdown document",
  content: {
    "text/markdown": { schema: { type: "string" } }
  }
}

const MARKDOWN_NOT_FOUND = {
  description: "Unknown slug — markdown body `# 404 Not Found`",
  content: {
    "text/markdown": { schema: { type: "string" } }
  }
}

const MARKDOWN_ERROR = {
  description: "Server error — markdown body `# 500 Error`",
  content: {
    "text/markdown": { schema: { type: "string" } }
  }
}

const slugParameter = (kind: string) => ({
  name: "slug",
  in: "path",
  required: true,
  description: `The ${kind} slug, exactly as listed in /sitemap.md.`,
  schema: { type: "string" }
})

// Only real surface belongs here: the content mirrors registered in
// markdown-proxy.config.ts plus the basketball scores API.
export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "basement.studio public API",
    version: "1.0.0",
    description:
      "Read-only content API for basement.studio, a digital design and engineering studio. Every content page has a markdown mirror — append `.md` to its URL or request the HTML URL with `Accept: text/markdown`. A live MCP server with the same content as callable tools is available at /.well-known/mcp (Streamable HTTP, no auth). The only read-write endpoint is the basketball leaderboard used by the on-site mini-game.",
    contact: {
      name: "basement.studio",
      url: `${SITE_URL}/contact`,
      email: "hello@basement.studio"
    }
  },
  servers: [{ url: SITE_URL }],
  paths: {
    "/{page}.md": {
      get: {
        operationId: "getPageMarkdown",
        summary: "Top-level page as markdown",
        description:
          "Markdown mirror of a top-level content page. `index` mirrors the homepage.",
        parameters: [
          {
            name: "page",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: [
                "index",
                "services",
                "people",
                "showcase",
                "faq",
                "blog",
                "contact",
                "lab"
              ]
            }
          }
        ],
        responses: {
          "200": MARKDOWN_RESPONSE,
          "500": MARKDOWN_ERROR
        }
      }
    },
    "/post/{slug}.md": {
      get: {
        operationId: "getPostMarkdown",
        summary: "Blog post as markdown",
        description:
          'Markdown mirror of a blog post. Slugs are listed under "Blog Posts" in /sitemap.md.',
        parameters: [slugParameter("blog post")],
        responses: {
          "200": MARKDOWN_RESPONSE,
          "404": MARKDOWN_NOT_FOUND,
          "500": MARKDOWN_ERROR
        }
      }
    },
    "/showcase/{slug}.md": {
      get: {
        operationId: "getProjectMarkdown",
        summary: "Showcase project as markdown",
        description:
          'Markdown mirror of a portfolio project / case study. Slugs are listed under "Projects" in /sitemap.md.',
        parameters: [slugParameter("project")],
        responses: {
          "200": MARKDOWN_RESPONSE,
          "404": MARKDOWN_NOT_FOUND,
          "500": MARKDOWN_ERROR
        }
      }
    },
    "/careers/{slug}.md": {
      get: {
        operationId: "getOpenPositionMarkdown",
        summary: "Open position as markdown",
        description:
          'Markdown mirror of an open job position. Slugs are listed under "Open Positions" in /sitemap.md.',
        parameters: [slugParameter("open position")],
        responses: {
          "200": MARKDOWN_RESPONSE,
          "404": MARKDOWN_NOT_FOUND,
          "500": MARKDOWN_ERROR
        }
      }
    },
    "/sitemap.md": {
      get: {
        operationId: "listContent",
        summary: "Content index",
        description:
          "Markdown index of every page, blog post, project, and open position, each linking to its markdown mirror. The starting point for content discovery.",
        responses: {
          "200": MARKDOWN_RESPONSE,
          "500": MARKDOWN_ERROR
        }
      }
    },
    "/llms.txt": {
      get: {
        operationId: "getLlmsTxt",
        summary: "llms.txt link map",
        description:
          "Curated link map of the site for LLMs and agents, per the llms.txt convention.",
        responses: {
          "200": {
            description: "Plain-text link map",
            content: { "text/plain": { schema: { type: "string" } } }
          }
        }
      }
    },
    "/agents.md": {
      get: {
        operationId: "getAgentsNotes",
        summary: "Notes for AI agents",
        description:
          "When-to-use guidance, contact channels, and crawler notes for AI agents.",
        responses: { "200": MARKDOWN_RESPONSE }
      }
    },
    "/openapi.json": {
      get: {
        operationId: "getOpenApiDocument",
        summary: "This document",
        responses: {
          "200": {
            description: "OpenAPI 3.1 document",
            content: { "application/json": { schema: { type: "object" } } }
          }
        }
      }
    },
    "/.well-known/mcp.json": {
      get: {
        operationId: "getMcpServerCard",
        summary: "MCP server discovery card",
        description:
          "Discovery document for the live MCP server at /.well-known/mcp (Streamable HTTP transport, no authentication).",
        responses: {
          "200": {
            description: "MCP server card",
            content: { "application/json": { schema: { type: "object" } } }
          }
        }
      }
    },
    "/api/scores": {
      get: {
        operationId: "getScores",
        summary: "Basketball leaderboard — top 25",
        description:
          "Top 25 scores from the on-site basketball mini-game (/basketball), highest first. Not cached (`Cache-Control: no-store`).",
        responses: {
          "200": {
            description: "Leaderboard entries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Score" }
                    }
                  },
                  required: ["data"]
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      },
      post: {
        operationId: "submitScore",
        summary: "Submit a basketball score",
        description:
          "Submits a score for the on-site basketball mini-game. Exists for the game client: submissions must carry a `timeWindowHash` anti-abuse token bound to the current 30-second window, so scores can only be posted from an active game session. Rate limited per `clientId` (3 requests/minute).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ScoreSubmission" }
            }
          }
        },
        responses: {
          "200": {
            description: "Score accepted (or an equal/lower score ignored)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean" } },
                  required: ["success"]
                }
              }
            }
          },
          "400": {
            description:
              "Validation failure — `error` is one of: Invalid time window hash, Invalid timestamp, Invalid time window verification, Invalid player name, Invalid score, Invalid client ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          },
          "429": {
            description: "Rate limited (per clientId)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Score: {
        type: "object",
        description: "A leaderboard row",
        properties: {
          id: { type: "integer" },
          player_name: {
            type: "string",
            minLength: 3,
            maxLength: 3,
            description: "Three-character arcade-style tag"
          },
          score: { type: "integer" },
          country: {
            type: "string",
            description: "Emoji flag of the submitter's country"
          },
          created_at: { type: "string", format: "date-time" }
        },
        additionalProperties: true
      },
      ScoreSubmission: {
        type: "object",
        properties: {
          playerName: {
            type: "string",
            minLength: 3,
            maxLength: 3,
            description: "Three-character arcade-style tag"
          },
          score: { type: "integer", minimum: 0, maximum: 399 },
          clientId: { type: "string" },
          timestamp: {
            type: "integer",
            description:
              "Client Unix time in milliseconds; must be within 30 seconds of server time"
          },
          timeWindowHash: {
            type: "string",
            description:
              "Anti-abuse token bound to the current 30-second time window, issued to the game client"
          }
        },
        required: [
          "playerName",
          "score",
          "clientId",
          "timestamp",
          "timeWindowHash"
        ]
      },
      ApiError: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"]
      },
      NotFoundError: {
        type: "object",
        description:
          "Returned for unknown /api/* paths so agents get structure instead of an HTML shell",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              hint: { type: "string" }
            },
            required: ["code", "message", "hint"]
          }
        },
        required: ["error"]
      }
    }
  }
}
