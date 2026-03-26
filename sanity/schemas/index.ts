import { award } from './documents/award'
import { client } from './documents/client'
import { department } from './documents/department'
import { labProject } from './documents/labProject'
import { openPosition } from './documents/openPosition'
import { person } from './documents/person'
import { post } from './documents/post'
import { postCategory } from './documents/postCategory'
import { project } from './documents/project'
import { projectCategory } from './documents/projectCategory'
import { showcaseEntry } from './documents/showcaseEntry'
import { testimonial } from './documents/testimonial'
import { value } from './documents/value'
import { codeBlock } from './objects/codeBlock'
import { codeSandbox } from './objects/codeSandbox'
import { gridGallery } from './objects/gridGallery'
import { quoteWithAuthor } from './objects/quoteWithAuthor'
import { showcaseItem } from './objects/showcaseItem'
import { sideNote } from './objects/sideNote'
import { socialNetwork } from './objects/socialNetwork'
import { tweetEmbed } from './objects/tweetEmbed'
import { careersPostPage } from './singletons/careersPostPage'
import { companyInfo } from './singletons/companyInfo'
import { homepage } from './singletons/homepage'
import { peoplePage } from './singletons/peoplePage'
import { servicesPage } from './singletons/servicesPage'
import { threeDAssets } from './singletons/threeDAssets'

export const schemaTypes = [
  // Document types
  award,
  client,
  department,
  labProject,
  openPosition,
  person,
  post,
  postCategory,
  project,
  projectCategory,
  showcaseEntry,
  testimonial,
  value,

  // Singleton types
  careersPostPage,
  companyInfo,
  homepage,
  peoplePage,
  servicesPage,
  threeDAssets,

  // Object types
  codeBlock,
  codeSandbox,
  gridGallery,
  quoteWithAuthor,
  showcaseItem,
  sideNote,
  socialNetwork,
  tweetEmbed,
]
