import { APIErrorCode, Client, isNotionClientError } from "@notionhq/client"

export interface CareerApplication {
  firstName: string
  lastName: string
  email: string
  location: string
  motivation: string
  tags: string
  position: string
  skills: string[]
  yearsOfExperience: string
  portfolio: string
  availability: string
  github: string
  linkedin: string
  salaryExpectations: number
}

function getRequiredEnv(name: "NOTION_API_KEY" | "NOTION_CAREERS_DB_ID") {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getNotionErrorMessage(error: unknown) {
  if (!isNotionClientError(error)) {
    return "Unknown Notion error"
  }

  switch (error.code) {
    case APIErrorCode.ObjectNotFound:
      return "Notion database not found. Verify the database ID and that the integration has access to the database."
    case APIErrorCode.Unauthorized:
      return "Notion unauthorized. Verify NOTION_API_KEY and confirm the integration token is valid."
    case APIErrorCode.ValidationError:
      return `Notion validation error: ${error.message}`
    default:
      return `Notion request failed: ${error.message}`
  }
}

export async function submitApplication(data: CareerApplication) {
  const notion = new Client({ auth: getRequiredEnv("NOTION_API_KEY") })

  try {
    await notion.pages.create({
      parent: { database_id: getRequiredEnv("NOTION_CAREERS_DB_ID") },
      properties: {
        "Full Name": {
          title: [{ text: { content: `${data.firstName} ${data.lastName}` } }]
        },
        Email: { email: data.email },
        Tags: { multi_select: [{ name: data.tags }] },
        Position: { select: { name: data.position } },
        Location: { rich_text: [{ text: { content: data.location } }] },
        Motivation: { rich_text: [{ text: { content: data.motivation } }] },
        Skills: { multi_select: data.skills.map((skill) => ({ name: skill })) },
        "Years of experience": { select: { name: data.yearsOfExperience } },
        Portfolio: { url: data.portfolio || null },
        "Availability to start": { select: { name: data.availability } },
        Github: { url: data.github || null },
        LinkedIn: { url: data.linkedin || null },
        "Salary Expectations": {
          number: data.salaryExpectations
        }
      }
    })

    return { success: true }
  } catch (error) {
    const message = getNotionErrorMessage(error)
    console.error("Failed to create Notion page:", message, error)
    return { success: false, error: message }
  }
}
