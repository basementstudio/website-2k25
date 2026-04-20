import { FooterContent } from "./footer-content"
import { fetchCompanyInfo, fetchPostsCount, fetchProjectsCount } from "./sanity"

export const Footer = async () => {
  const [projectsCount, postsCount, companyInfo] = await Promise.all([
    fetchProjectsCount(),
    fetchPostsCount(),
    fetchCompanyInfo()
  ])

  return (
    <FooterContent
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
