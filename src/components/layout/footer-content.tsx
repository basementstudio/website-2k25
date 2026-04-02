import { cn } from "@/utils/cn"

import type { QueryType } from "./query"
import { Copyright, InternalLinks, SocialLinks } from "./shared-sections"
import { StayConnected } from "./stay-connected"

const Logo = ({ className }: { className?: string }) => (
  <>
    <svg
      viewBox="0 0 356 46"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={cn("block lg:hidden", className)}
    >
      <title>basement.studio</title>
      <path d="M0.870091 1.37606H44.6059C58.9235 1.37606 62.5029 3.66911 62.5029 12.7295C62.5029 19.329 58.4201 22.3491 48.8005 22.7965V23.1321C59.4828 23.7473 64.0689 26.8793 64.0689 33.5347C64.0689 42.7069 60.1539 45 44.6059 45H0.870091V1.37606ZM19.8857 35.4922H36.0489C42.8721 35.4922 44.6059 34.7092 44.6059 31.4654C44.6059 28.5571 42.0332 27.3267 36.0489 27.3267H19.8857V35.4922ZM19.8857 18.3782H34.9303C40.635 18.3782 43.0399 17.2596 43.0399 14.687C43.0399 11.6668 41.418 10.8838 34.9303 10.8838H19.8857V18.3782ZM101.407 36.1634C114.103 36.1634 115.501 35.8278 115.501 32.6399C115.501 29.7875 112.313 28.8368 99.5055 27.886C75.0089 26.0404 68.9128 23.244 68.9128 13.7921C68.9128 3.33354 75.4564 0.70492 101.743 0.70492C127.861 0.70492 134.796 3.89283 134.796 16.6444H115.501C115.501 10.8279 114.103 10.2127 101.743 10.2127C89.8299 10.2127 88.4876 10.6042 88.4876 13.904C88.4876 16.5326 91.1162 17.3156 101.519 17.9308C128.364 19.3849 135.076 22.461 135.076 33.2551C135.076 43.2103 128.42 45.6711 101.743 45.6711C75.0649 45.6711 67.962 42.5951 67.962 30.3468H87.2572C87.2572 35.6041 88.6554 36.1634 101.407 36.1634ZM157.727 45H139.27V1.37606L171.205 1.48791L182.223 30.962H182.671L193.577 1.37606H223.163V45H204.147V13.9599H203.811L192.402 45H169.583L158.23 14.631H157.727V45ZM228.734 45V1.37606H246.351L273.196 24.5303H273.532L273.476 1.37606H292.492V45H275.601L248.085 21.3424H247.749V45H228.734ZM316.05 45V11.4431H295.581V1.37606H355.648V11.4431H335.066V45H316.05Z" />
    </svg>

    <svg
      className={cn("hidden lg:block", className)}
      fill="currentColor"
      viewBox="0 0 1673 149"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>basement.studio</title>
      <path d="M1672.4 96.7552C1672.4 138.38 1651.5 148.74 1567.69 148.74C1481.48 148.74 1459.84 133.94 1459.84 75.1102C1459.84 16.8352 1481.48 2.22021 1567.69 2.22021H1663.15V33.6702H1567.69C1528.84 33.6702 1524.59 35.3352 1524.59 49.5802V71.5952H1525.7C1529.58 50.5052 1544.57 45.3252 1600.62 45.3252C1657.97 45.3252 1672.4 55.6852 1672.4 96.7552ZM1524.59 97.1252C1524.59 116.92 1528.84 119.14 1567.69 119.14C1603.58 119.14 1607.65 116.92 1607.65 96.9402C1607.65 77.8852 1603.58 75.8502 1567.69 75.8502C1528.84 75.8502 1524.59 77.8852 1524.59 97.1252Z" />
      <path d="M1442.41 146.52H1261.67V105.82L1344.36 72.52C1378.03 59.015 1381.36 53.28 1381.36 44.03C1381.36 32.93 1378.4 31.45 1351.21 31.45C1324.57 31.45 1321.61 33.485 1321.61 51.8H1256.86C1256.86 9.99001 1275.73 0 1351.39 0C1427.8 0 1446.85 7.4 1446.85 37C1446.85 60.31 1439.08 69.93 1398.75 85.47L1326.6 113.22H1442.41V146.52Z" />
      <path d="M1183.71 109.52H1239.21V146.52H1183.71V109.52Z" />
      <path d="M1042.56 146.52V35.5202H974.852V2.22021H1173.54V35.5202H1105.46V146.52H1042.56Z" />
      <path d="M753.73 146.52V2.22021H812.005L900.805 78.8102H901.915L901.73 2.22021H964.63V146.52H908.76L817.74 68.2652H816.63V146.52H753.73Z" />
      <path d="M518.855 146.52H457.805V2.22021L563.44 2.59021L599.885 100.085H601.365L637.44 2.22021H735.305V146.52H672.405V43.8452H671.295L633.555 146.52H558.075L520.52 46.0652H518.855V146.52Z" />
      <path d="M332.56 117.29C374.555 117.29 379.18 116.18 379.18 105.635C379.18 96.2 368.635 93.055 326.27 89.91C245.24 83.805 225.075 74.555 225.075 43.29C225.075 8.695 246.72 0 333.67 0C420.065 0 443.005 10.545 443.005 52.725H379.18C379.18 33.485 374.555 31.45 333.67 31.45C294.265 31.45 289.825 32.745 289.825 43.66C289.825 52.355 298.52 54.945 332.93 56.98C421.73 61.79 443.93 71.965 443.93 107.67C443.93 140.6 421.915 148.74 333.67 148.74C245.425 148.74 221.93 138.565 221.93 98.05H285.755C285.755 115.44 290.38 117.29 332.56 117.29Z" />
      <path d="M0 2.22021H144.67C192.03 2.22021 203.87 9.80522 203.87 39.7752C203.87 61.6052 190.365 71.5952 158.545 73.0752V74.1852C193.88 76.2202 209.05 86.5802 209.05 108.595C209.05 138.935 196.1 146.52 144.67 146.52H0V2.22021ZM62.9 115.07H116.365C138.935 115.07 144.67 112.48 144.67 101.75C144.67 92.1302 136.16 88.0602 116.365 88.0602H62.9V115.07ZM62.9 58.4602H112.665C131.535 58.4602 139.49 54.7602 139.49 46.2502C139.49 36.2602 134.125 33.6702 112.665 33.6702H62.9V58.4602Z" />
    </svg>
  </>
)

export const FooterContent = ({ data }: { data: QueryType }) => {
  const projects = data.pages.showcase.projectList.items.length
  const posts = data.pages.blog.posts.items.length

  const LINKS = [
    {
      title: "Home",
      href: "/"
    },
    {
      title: "Services",
      href: "/services"
    },
    {
      title: "Showcase",
      href: "/showcase",
      count: projects
    },
    {
      title: "People",
      href: "/people"
    },
    {
      title: "Careers",
      href: "/people#open-positions"
    },
    {
      title: "Blog",
      href: "/blog",
      count: posts
    },
    {
      title: "Lab",
      href: "/lab"
    }
  ]

  return (
    <footer className="relative z-10 flex flex-col justify-between bg-brand-k pb-4 lg:h-[calc(100dvh-3.25rem)]">
      <div className="grid-layout">
        <Logo className="col-span-full mx-auto border-b border-brand-w1/30 pb-2 text-brand-w2 lg:pb-4" />
      </div>

      <div className="grid-layout relative grid-rows-[auto_auto_28px] !gap-y-10 pb-2 pt-4 lg:grid-rows-[auto] lg:items-end lg:!gap-y-2 lg:py-0">
        <InternalLinks
          className="col-start-1 col-end-5 row-start-1 border-b border-brand-w1/30 pb-4 lg:col-start-7 lg:col-end-9 lg:border-none lg:pb-0"
          links={LINKS}
          onNav={false}
        />

        <StayConnected
          className="col-start-1 col-end-5 row-start-2 hidden lg:row-auto"
          content={data.company.social.newsletter.json.content}
        />

        <div className="col-span-full row-start-3 flex flex-col justify-end gap-y-2 lg:hidden">
          <SocialLinks
            className="col-start-1 col-end-5 row-start-2 lg:hidden"
            links={{
              ...data.company.social,
              linkedIn: data.company.social.linkedIn || ""
            }}
          />
          <Copyright className="text-left" />
        </div>

        <div className="col-start-10 col-end-13 hidden translate-y-[3px] flex-col items-end gap-y-2 lg:flex">
          <SocialLinks
            links={{
              ...data.company.social,
              linkedIn: data.company.social.linkedIn || ""
            }}
          />
          <Copyright />
        </div>
      </div>
    </footer>
  )
}
