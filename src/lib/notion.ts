// TODO: replace mock with real Notion API call
// 1. bun add @notionhq/client
// 2. Set NOTION_API_KEY and NOTION_CAREERS_DB_ID in .env
// 3. Uncomment the real implementation below

export interface CareerApplication {
  firstName: string
  lastName: string
  email: string
  location: string
  motivation: string
  position: string
  designSkills: string[]
  yearsOfExperience: string
  portfolio: string
  availability: string
  linkedin: string
  salaryExpectations: string
}

export async function submitApplication(data: CareerApplication) {
  console.log("[Notion Mock] Career application:", data)
  await new Promise((r) => setTimeout(r, 500))
  return { success: true }

  /* Real implementation:
  import { Client } from "@notionhq/client"
  const notion = new Client({ auth: process.env.NOTION_API_KEY })
  await notion.pages.create({
    parent: { database_id: process.env.NOTION_CAREERS_DB_ID! },
    properties: {
      "Name": { title: [{ text: { content: `${data.firstName} ${data.lastName}` } }] },
      "Email": { email: data.email },
      "Position": { select: { name: data.position } },
      "Location": { rich_text: [{ text: { content: data.location } }] },
      "Motivation": { rich_text: [{ text: { content: data.motivation } }] },
      "Design Skills": { multi_select: data.designSkills.map(s => ({ name: s })) },
      "Years of Experience": { select: { name: data.yearsOfExperience } },
      "Portfolio": { url: data.portfolio || null },
      "Availability": { select: { name: data.availability } },
      "LinkedIn": { url: data.linkedin || null },
      "Salary Expectations": { rich_text: [{ text: { content: data.salaryExpectations } }] },
    }
  })
  return { success: true }
  */
}
