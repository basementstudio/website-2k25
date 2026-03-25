import { APIErrorCode, Client, isNotionClientError } from "@notionhq/client"

type NotionPageProperties = NonNullable<
  Parameters<Client["pages"]["create"]>[0]["properties"]
>

export interface CareerApplication {
  firstName: string
  lastName: string
  email: string
  location: string
  whyDoYouWantToJoin: string
  tags: string
  position: string
  skills: string[]
  yearsOfExperience: string
  portfolio: string
  github: string
  availabilityToStart: string
  linkedin: string
  salaryExpectations?: number
}

export interface CareerFormData {
  firstName: string
  lastName: string
  email: string
  location: string
  whyDoYouWantToJoin: string
  tags: string
  position: string
  skills: string[]
  yearsOfExperience: string
  portfolio: string
  github: string
  availabilityToStart: string
  linkedin: string
  salaryExpectations?: number
  companyWebsite: string
  formStartedAt: number
}

function getRequiredEnv(name: "NOTION_API_KEY" | "NOTION_CAREERS_DB_ID") {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function normalizeNotionUuid(value: string) {
  const trimmedValue = value.trim()
  const urlMatch = trimmedValue.match(/[0-9a-fA-F]{32}/)

  if (urlMatch) {
    const rawId = urlMatch[0]
    return `${rawId.slice(0, 8)}-${rawId.slice(8, 12)}-${rawId.slice(12, 16)}-${rawId.slice(16, 20)}-${rawId.slice(20)}`
  }

  const uuidMatch = trimmedValue.match(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  )

  if (uuidMatch) {
    return uuidMatch[0]
  }

  throw new Error(
    "NOTION_CAREERS_DB_ID must be a Notion page UUID or page URL."
  )
}

export function buildApplicationData(
  formData: CareerFormData
): CareerApplication {
  return {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    location: formData.location.trim(),
    whyDoYouWantToJoin: formData.whyDoYouWantToJoin.trim().slice(0, 2000),
    tags: formData.tags.trim(),
    position: formData.position.trim(),
    skills: formData.skills.map((skill) => skill.trim()).filter(Boolean),
    yearsOfExperience: formData.yearsOfExperience.trim(),
    portfolio: formData.portfolio.trim(),
    github: formData.github.trim(),
    availabilityToStart: formData.availabilityToStart.trim(),
    linkedin: formData.linkedin.trim(),
    salaryExpectations: formData.salaryExpectations || undefined
  }
}

function getApplicationTitle(data: CareerApplication) {
  const fullName = `${data.firstName} ${data.lastName}`.trim()

  if (fullName) return fullName
  if (data.email.trim()) return data.email.trim()

  return `${data.position} applicant ${new Date().toISOString()}`
}

function getNotionErrorMessage(error: unknown) {
  if (!isNotionClientError(error)) {
    return "Unknown Notion error"
  }

  switch (error.code) {
    case APIErrorCode.ObjectNotFound:
      return "Notion resource not found. Verify the configured parent page and that the integration has access to it."
    case APIErrorCode.Unauthorized:
      return "Notion unauthorized. Verify NOTION_API_KEY and confirm the integration token is valid."
    case APIErrorCode.ValidationError:
      return `Notion validation error: ${error.message}`
    default:
      return `Notion request failed: ${error.message}`
  }
}

// SDK @notionhq/client@5.13.0 manages the Notion-Version header automatically
export async function submitApplication(data: CareerApplication) {
  const notion = new Client({ auth: getRequiredEnv("NOTION_API_KEY") })

  try {
    console.info("[Notion] Starting career application submission", {
      position: data.position,
      email: data.email,
      skillsCount: data.skills.length
    })

    const databaseId = normalizeNotionUuid(
      getRequiredEnv("NOTION_CAREERS_DB_ID")
    )
    const properties: NotionPageProperties = {
      "Fecha de creación": { date: { start: new Date().toISOString() } },
      "Full Name": {
        title: [{ text: { content: getApplicationTitle(data) } }]
      },
      Position: { select: { name: data.position } },
      Estado: { status: { name: "Pending" } }
    }

    if (data.email.trim()) {
      properties.Email = { email: data.email.trim() }
    }

    if (data.location.trim()) {
      properties["Country/City"] = {
        rich_text: [{ text: { content: data.location.trim() } }]
      }
    }

    if (data.whyDoYouWantToJoin.trim()) {
      properties["Why do you want to join"] = {
        rich_text: [{ text: { content: data.whyDoYouWantToJoin.trim() } }]
      }
    }

    if (data.skills.length > 0) {
      properties.Skills = {
        multi_select: data.skills.map((skill) => ({ name: skill }))
      }
    }

    if (data.yearsOfExperience.trim()) {
      properties["Years of experience"] = {
        select: { name: data.yearsOfExperience.trim() }
      }
    }

    if (data.portfolio.trim()) {
      properties.Portfolio = { url: data.portfolio.trim() }
    }

    if (data.github.trim()) {
      properties.Github = { url: data.github.trim() }
    }

    if (data.availabilityToStart.trim()) {
      properties["Availability to start"] = {
        select: { name: data.availabilityToStart.trim() }
      }
    }

    if (data.linkedin.trim()) {
      properties.LinkedIn = { url: data.linkedin.trim() }
    }

    if (data.salaryExpectations !== undefined) {
      properties["Salary Expectations"] = {
        number: data.salaryExpectations
      }
    }

    if (data.tags.trim()) {
      properties.Tags = { multi_select: [{ name: data.tags.trim() }] }
    }

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties
    })

    console.info("[Notion] Created application page", {
      databaseId,
      position: data.position,
      email: data.email
    })

    return { success: true }
  } catch (error) {
    const message = getNotionErrorMessage(error)
    console.error("[Notion] Failed to create application page", {
      position: data.position,
      email: data.email,
      message,
      error
    })
    return { success: false, error: message }
  }
}
