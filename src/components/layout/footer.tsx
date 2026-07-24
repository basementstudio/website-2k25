import { FooterContent } from "./footer-content"
import {
  fetchCompanyInfo,
  fetchCurrentYear,
  fetchPostsCount,
  fetchProjectsCount
} from "./sanity"

export const Footer = async () => {
  const [projectsCount, postsCount, companyInfo, year] = await Promise.all([
    fetchProjectsCount(),
    fetchPostsCount(),
    fetchCompanyInfo(),
    fetchCurrentYear()
  ])

  return (
    <FooterContent
      year={year}
      projectsCount={projectsCount}
      postsCount={postsCount}
      socialLinks={{
        twitter: companyInfo.twitter || "",
        instagram: companyInfo.instagram || "",
        github: companyInfo.github || "",
        linkedIn: companyInfo.linkedIn || ""
      }}
      newsletter={companyInfo.newsletter || []}
    />
  )
}
