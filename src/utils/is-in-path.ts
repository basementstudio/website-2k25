export const isInPath = (link: string, pathname: string) =>
  link === pathname ||
  (pathname.includes("/showcase/") && link === "/showcase") ||
  (pathname.includes("/blog/") && link === "/blog") ||
  (pathname.includes("/post/") && link === "/blog")
